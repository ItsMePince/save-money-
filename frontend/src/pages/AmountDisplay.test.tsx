// AmountDisplay.test.tsx
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AmountDisplay from "./AmountDisplay"; // Import คอมโพเนนท์ของคุณ

// --- Mock ResizeObserver ---
// JSDOM ไม่มี ResizeObserver, เราจึงต้อง mock มัน
// เราจะเก็บ callback ที่ถูกส่งเข้ามา เพื่อที่เราจะสามารถ "สั่ง" ให้มันทำงานได้
let resizeObserverCallback: (entries: any) => void;
const MockResizeObserver = vi.fn((callback) => {
    resizeObserverCallback = callback; // เก็บ callback ไว้
    return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
    };
});

describe("AmountDisplay Component", () => {
    // สร้าง spies สำหรับ mock layout properties
    let clientWidthSpy: ReturnType<typeof vi.spyOn>;
    let scrollWidthSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Stub (จำลอง) ResizeObserver ก่อนทุกเทสต์
        vi.stubGlobal("ResizeObserver", MockResizeObserver);

        // Mock implementation พื้นฐานของ layout properties
        // ปกติ JSDOM จะคืนค่า 0 ซึ่งจะทำให้เทสต์พัง
        // เราตั้งค่า default ให้ container กว้าง 100px และ text กว้าง 50px (พอดี)
        clientWidthSpy = vi
            .spyOn(HTMLElement.prototype, "clientWidth", "get")
            .mockReturnValue(100);
        scrollWidthSpy = vi
            .spyOn(HTMLElement.prototype, "scrollWidth", "get")
            .mockReturnValue(50);
    });

    afterEach(() => {
        // คืนค่า mock ทั้งหมดกลับเป็นเหมือนเดิม
        vi.restoreAllMocks();
    });

    // --- Tests ---

    it("ควร render ตัวเลขที่ format แล้ว และ 'หน่วย' ที่เป็น default", () => {
        render(<AmountDisplay value={12345} />);

        expect(screen.getByText("12,345")).toBeInTheDocument(); // 12345 -> 12,345
        expect(screen.getByText("บาท")).toBeInTheDocument(); // default unit
    });

    it("ควร render ตัวเลขที่ไม่ต้อง format และ 'หน่วย' ที่กำหนดเอง", () => {
        render(<AmountDisplay value={500} unit="USD" />);

        expect(screen.getByText("500")).toBeInTheDocument(); // ไม่ต้องใส่ comma
        expect(screen.getByText("USD")).toBeInTheDocument();
    });

    it("ควร render string ที่ format มาแล้ว (เช่น มีทศนิยม) โดยไม่ format ซ้ำ", () => {
        render(<AmountDisplay value="1,234.56" />);

        expect(screen.getByText("1,234.56")).toBeInTheDocument(); // ไม่ควรแตะต้อง
        expect(screen.getByText("บาท")).toBeInTheDocument();
    });

    it("ควรใช้ font-size 'max' (28px) ถ้าข้อความพอดี", () => {
        // Mocks จาก beforeEach: clientWidth=100, scrollWidth=50 (พอดี)
        render(<AmountDisplay value={100} max={28} min={12} />);

        const numSpan = screen.getByText("100");
        // useLayoutEffect ทำงานตอน render และ 'fit' logic เห็นว่าพอดี
        expect(numSpan.style.fontSize).toBe("28px");
    });

    it("ควรลด font-size ลงจนกว่าจะพอดี (useLayoutEffect)", () => {
        // 1. ทำให้ container กว้าง 100px
        clientWidthSpy.mockReturnValue(100);

        // 2. จำลอง scrollWidth แบบไดนามิก
        scrollWidthSpy.mockImplementation(function (this: HTMLElement) {
            // 'this' คือ <span class="num">
            const fs = parseInt(this.style.fontSize, 10);

            // ถ้า font size > 20px, ให้คืนค่า 150 (ใหญ่เกิน container)
            if (fs > 20) return 150;

            // ถ้า font size = 20px หรือน้อยกว่า, ให้คืนค่า 90 (พอดี)
            return 90;
        });

        // Render component (max=30, min=10)
        render(<AmountDisplay value={1000000000} max={30} min={10} />);

        // useLayoutEffect จะรัน fit()
        // Loop จะทำงาน: 30px(150) -> 29px(150) ... -> 21px(150) -> 20px(90) -> หยุด
        const numSpan = screen.getByText("1,000,000,000");
        expect(numSpan.style.fontSize).toBe("20px");
    });

    it("ควรไม่ลด font-size ต่ำกว่า 'min'", () => {
        // 1. Container กว้าง 100px
        clientWidthSpy.mockReturnValue(100);

        // 2. scrollWidth ใหญ่ *เสมอ* (150px)
        scrollWidthSpy.mockReturnValue(150);

        // Render component (max=30, min=15)
        render(<AmountDisplay value={1000000000} max={30} min={15} />);

        // Loop จะทำงาน: 30px -> 29px ... -> 15px
        // ที่ 15px, scrollWidth(150) > clientWidth(100) แต่ s > min (15 > 15) เป็น false
        // Loop จึงหยุดที่ 15px
        const numSpan = screen.getByText("1,000,000,000");
        expect(numSpan.style.fontSize).toBe("15px");
    });

    it("ควรปรับขนาด font-size ใหม่ เมื่อ container ถูก resize (ResizeObserver)", () => {
        // --- 1. Render ครั้งแรก ---

        // Container กว้าง 200px (กว้างมาก)
        clientWidthSpy.mockReturnValue(200);
        // Text กว้าง 150px (พอดี)
        scrollWidthSpy.mockReturnValue(150);

        render(<AmountDisplay value={12345} max={30} min={10} />);
        const numSpan = screen.getByText("12,345");

        // พอดี -> ควรใช้ max size
        expect(numSpan.style.fontSize).toBe("30px");

        // --- 2. จำลองการ Resize ---

        // 2.1. เปลี่ยน mock: container "หด" เหลือ 100px
        clientWidthSpy.mockReturnValue(100);

        // 2.2. เปลี่ยน mock: scrollWidth ให้เป็นไดนามิก
        // (ต้อง spyOn ที่ตัว numSpan เอง เพราะ spyOn ที่ prototype จะถูก override)
        vi.spyOn(numSpan, 'scrollWidth', 'get').mockImplementation(() => {
            const fs = parseInt(numSpan.style.fontSize, 10);
            if (fs > 20) return 150; // ถ้า > 20px (เช่น 30px) จะกว้าง 150px (ไม่พอดี)
            return 90; // ถ้า <= 20px จะกว้าง 90px (พอดี)
        });

        // 2.3. สั่งให้ ResizeObserver ที่เรา mock ไว้ "ยิง" callback
        // (ใช้ act เพื่อให้แน่ใจว่า React re-render เสร็จ)
        act(() => {
            resizeObserverCallback(null); // ยิง callback -> fit() ทำงานใหม่
        });

        // Loop ควรทำงานใหม่: 30px(150) -> ... -> 20px(90) -> หยุด
        expect(numSpan.style.fontSize).toBe("20px");
    });
});
