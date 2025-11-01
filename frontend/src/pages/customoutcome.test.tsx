// src/pages/customoutcome.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react"; // เพิ่ม waitFor
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CategoryCustom from "./customoutcome";
import { TempCategoryProvider } from "../TempCategoryContext";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock TempCategoryContext (สำคัญ!)
const mockSetTempCategory = vi.fn();
vi.mock("../TempCategoryContext", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        // Mock เฉพาะ hook ที่เราจะใช้
        useTempCategory: () => ({
            setTempCategory: mockSetTempCategory, // ส่ง mock function เข้าไป
        }),
    };
});

// Mock BottomNav (ถ้าจำเป็น)
vi.mock("./buttomnav", () => ({
    default: () => <div data-testid="bottom-nav-mock" />,
}));


// --- Test Setup ---
function renderWithProvider(ui: React.ReactNode) {
    return render(
        // ใช้ Route เริ่มต้น เพราะ Component อาจจะอ่าน path
        <MemoryRouter initialEntries={['/custom-outcome']}>
            <TempCategoryProvider>{ui}</TempCategoryProvider>
        </MemoryRouter>
    );
}

describe("CustomOutcome Page", () => {
    // Mock alert ก่อนทุก Test
    beforeEach(() => {
        vi.spyOn(window, "alert").mockImplementation(() => {});
        // ล้าง mock navigate และ setTempCategory ทุกครั้ง
        mockNavigate.mockClear();
        mockSetTempCategory.mockClear();
    });

    // คืนค่า mock หลังทุก Test
    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- Tests ---

    it("ควร render หน้าจอพร้อมแสดงหัวข้อและ Input ต่างๆ", () => {
        renderWithProvider(<CategoryCustom />);
        // เช็คหัวข้อ
        expect(screen.getByRole('heading', { name: /OutcomeCustom/i })).toBeInTheDocument();
        // เช็ค Input ค้นหา
        expect(screen.getByPlaceholderText(/ค้นหาไอคอน…/i)).toBeInTheDocument();
        // เช็ค Input ชื่อหมวดหมู่
        expect(screen.getByPlaceholderText("ชื่อหมวดหมู่")).toBeInTheDocument();
        // เช็คปุ่มยืนยัน (ใช้ aria-label)
        expect(screen.getByLabelText("ยืนยัน")).toBeInTheDocument();
    });

    it("ควรกรองไอคอนเมื่อพิมพ์ในช่องค้นหา และแสดงข้อความ 'ไม่พบ' ถ้าไม่มี", async () => {
        const user = userEvent.setup();
        renderWithProvider(<CategoryCustom />);
        const searchInput = screen.getByPlaceholderText(/ค้นหาไอคอน…/i);

        // พิมพ์คำที่เจอ
        await user.type(searchInput, "กาแฟ");
        expect(screen.getByTitle("กาแฟ")).toBeInTheDocument();
        // ไอคอนอื่นควรหายไป (ถ้ามีไอคอนอื่นให้เช็ค)
        expect(screen.queryByTitle("รถยนต์")).not.toBeInTheDocument();

        // พิมพ์คำที่ไม่เจอ
        await user.clear(searchInput);
        await user.type(searchInput, "zzzzz");
        expect(screen.getByText(/ไม่พบไอคอนที่ตรงกับ “zzzzz”/i)).toBeInTheDocument();
        expect(screen.queryByTitle("กาแฟ")).not.toBeInTheDocument();
    });

    it("ควรเลือกไอคอนได้เมื่อคลิก และแสดงไอคอนที่เลือกในส่วน Creator", async () => {
        const user = userEvent.setup();
        // ⬇️ ดึง container มาใช้
        const { container } = renderWithProvider(<CategoryCustom />);
        const coffeeBtn = screen.getByTitle("กาแฟ");

        // ก่อนคลิก ควรมีเครื่องหมาย '?' อยู่ใน div.cc-picked
        // ⬇️ หา container ด้วย class (ต้องใช้ container.querySelector)
        const initialPickedContainer = container.querySelector('.cc-picked');
        expect(initialPickedContainer).toHaveTextContent('?');

        // คลิกปุ่มกาแฟ
        await user.click(coffeeBtn);

        // ปุ่มควรมี class active
        expect(coffeeBtn).toHaveClass("active");

        // [✅ แก้ไข] รอและตรวจสอบผลลัพธ์ทางอ้อม
        await waitFor(() => {
            // หา container อีกครั้ง (หรือใช้ตัวแปรเดิมก็ได้)
            const updatedPickedContainer = container.querySelector('.cc-picked');
            // เครื่องหมาย '?' ควรหายไป
            expect(updatedPickedContainer).not.toHaveTextContent('?');
            // ควรมี SVG (ไอคอน) แสดงขึ้นมาแทน
            expect(updatedPickedContainer?.querySelector('svg')).toBeInTheDocument();
            // (Optional แต่แนะนำ) เช็ค class ของ SVG ถ้า lucide-react ใส่ไว้
            // เพื่อให้มั่นใจว่าเป็นไอคอนกาแฟจริงๆ
            expect(updatedPickedContainer?.querySelector('svg[class*="lucide-coffee"]')).toBeInTheDocument();
        });
    });

    it("ควรแสดง Alert ถ้ากดยืนยันโดย 'ไม่ได้เลือกไอคอน'", async () => {
        const user = userEvent.setup();
        renderWithProvider(<CategoryCustom />);
        // กรอกชื่ออย่างเดียว
        await user.type(screen.getByPlaceholderText("ชื่อหมวดหมู่"), "หมวดใหม่");
        // กดยืนยัน
        await user.click(screen.getByLabelText("ยืนยัน"));

        expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
        expect(mockSetTempCategory).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("ควรแสดง Alert ถ้ากดยืนยันโดย 'ไม่ได้กรอกชื่อ'", async () => {
        const user = userEvent.setup();
        renderWithProvider(<CategoryCustom />);
        // เลือกไอคอนอย่างเดียว
        await user.click(screen.getByTitle("งาน"));
        // กดยืนยัน
        await user.click(screen.getByLabelText("ยืนยัน"));

        expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
        expect(mockSetTempCategory).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("ควรเรียก setTempCategory และ navigate(-1) เมื่อกดยืนยันข้อมูลครบถ้วน", async () => {
        const user = userEvent.setup();
        renderWithProvider(<CategoryCustom />);

        // 1. เลือกไอคอน (เช่น 'งาน' มี key 'briefcase')
        await user.click(screen.getByTitle("งาน"));

        // 2. กรอกชื่อ
        await user.type(screen.getByPlaceholderText("ชื่อหมวดหมู่"), "งานอดิเรก");

        // 3. กดยืนยัน
        await user.click(screen.getByLabelText("ยืนยัน"));

        // 4. ตรวจสอบผล
        expect(window.alert).not.toHaveBeenCalled();
        // เช็คว่า setTempCategory ถูกเรียกด้วยข้อมูลที่ถูกต้อง
        expect(mockSetTempCategory).toHaveBeenCalledTimes(1);
        expect(mockSetTempCategory).toHaveBeenCalledWith({
            name: "งานอดิเรก",
            iconKey: "briefcase", // ตรวจสอบ key ให้ตรงกับ ICON_SETS
        });
        // เช็คว่า navigate กลับไปหน้าก่อนหน้า
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});