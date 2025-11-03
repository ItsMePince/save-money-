// src/pages/month.test.tsx
import React from "react";
import { MemoryRouter } from "react-router-dom";
import Month from "./month";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

declare global {
    // eslint-disable-next-line no-var
    var fetch: any;
}

/* ---------------- Polyfill for Recharts ---------------- */
/* ---------------- Polyfill for Recharts ---------------- */
beforeAll(() => {
    // @ts-ignore
    if (typeof global.ResizeObserver === "undefined") {
        // @ts-ignore
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
});

const onlyNumber = (s: string | null | undefined) => (s ?? "").replace(/[^\d]/g, "");

/** สร้าง mock fetch ที่ resolve เป็นค่าที่ระบุ 1 ครั้ง */
function mockFetchResolveOnce(data: any, ok = true) {
    global.fetch = vi.fn().mockResolvedValue({
        ok,
        json: async () => data,
        text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
    }) as any;
}

describe("Month Page", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("แสดงสถานะ loading ตอนแรก", async () => {
        // ทำให้ fetch ค้างไว้ก่อน เพื่อเช็คจอ Loading
        let resolveFn: (v: any) => void = () => {};
        const pending = new Promise((res) => (resolveFn = res));
        global.fetch = vi.fn().mockReturnValueOnce(pending);

        render(
            <MemoryRouter>
                <Month />
            </MemoryRouter>
        );

        // มีข้อความ 'กำลังโหลด' อย่างน้อยหนึ่งจุด
        const loadingEls = screen.getAllByText((_, node) =>
            !!node?.textContent?.toLowerCase().includes("load") ||
            !!node?.textContent?.includes("กำลังโหลด")
        );
        expect(loadingEls.length).toBeGreaterThanOrEqual(1);

        // ปล่อย fetch ให้เสร็จ
        resolveFn({
            ok: true,
            json: async () => [],
            text: async () => "[]",
        });

        // รอให้ข้อความโหลดหายไปทั้งหมด
        await waitFor(() => {
            const still = screen.queryAllByText((_, node) =>
                !!node?.textContent?.toLowerCase().includes("load") ||
                !!node?.textContent?.includes("กำลังโหลด")
            );
            expect(still.length).toBe(0);
        });
    });

    it("แสดงข้อความ error เมื่อ API ล้มเหลว", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "เกิดข้อผิดพลาด",
        }) as any;

        render(
            <MemoryRouter>
                <Month />
            </MemoryRouter>
        );

        // คอมโพเนนต์แสดงว่า "โหลดข้อมูลไม่สำเร็จ (...)" อยู่ใน DOM
        await waitFor(() => {
            expect(screen.getByText(/โหลดข้อมูลไม่สำเร็จ/i)).toBeInTheDocument();
        });
    });

    it("แสดง 'ไม่มีรายการในเดือนนี้' เมื่อ API คืน array ว่าง", async () => {
        mockFetchResolveOnce([]);

        render(
            <MemoryRouter>
                <Month />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/ไม่มีรายการในเดือนนี้/i)).toBeInTheDocument();
        });

        // KPI ควรเป็น 0 ทั้งหมด (อ่านจาก kpi-inline เพื่อเลี่ยงชนกับ cell ใน grid)
        const kpiInline = screen.getByText(/รายรับ:/i).closest(".kpi-inline") as HTMLElement;
        const incomeEl  = kpiInline.querySelector("b.income") as HTMLElement;
        const expenseEl = kpiInline.querySelector("b.expense") as HTMLElement;
        const balanceEl = kpiInline.querySelector("b.balance") as HTMLElement;

        expect(onlyNumber(incomeEl.textContent)).toBe("0");
        expect(onlyNumber(expenseEl.textContent)).toBe("0");
        expect(onlyNumber(balanceEl.textContent)).toBe("0");
    });

    it("แสดงข้อมูลเมื่อโหลดสำเร็จ และคำนวณ KPI ถูกต้อง", async () => {
        // จัด mock เฉพาะเคสนี้
        const sample = [
            { id: 1, date: "2025-09-01", type: "INCOME",  amount: 12000, category: "เงินเดือน" },
            { id: 2, date: "2025-09-01", type: "EXPENSE", amount: 3000,  category: "อาหาร"   },
        ];

        const fetchMock = vi
            .spyOn(global as any, "fetch")
            .mockResolvedValue({
                ok: true,
                json: async () => sample,
                text: async () => JSON.stringify(sample),
            } as any);

        render(
            <MemoryRouter>
                <Month />
            </MemoryRouter>
        );

        // ยืนยันว่ามีการยิง fetch แล้ว
        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        // รอให้สลับจาก loading เป็นการ์ดสรุป
        const title = await screen.findByText(/สรุปรายเดือน/i);
        const summaryCard = title.closest(".summary-card") as HTMLElement;

        // ตรวจ KPI เฉพาะในการ์ดสรุป (กันชนกับตัวเลขใน grid)
        const kpi = summaryCard.querySelector(".kpi-inline") as HTMLElement;
        expect(within(kpi).getByText(/12,?000/)).toBeInTheDocument(); // รายรับ
        expect(within(kpi).getByText(/3,?000/)).toBeInTheDocument();  // รายจ่าย
        expect(within(kpi).getByText(/9,?000/)).toBeInTheDocument();  // คงเหลือ

        expect(await screen.findAllByText(/12,?000/)).not.toHaveLength(0);
        expect(await screen.findAllByText(/3,?000/)).not.toHaveLength(0);
        expect(await screen.findAllByText(/9,?000/)).not.toHaveLength(0);

    });

    it("เปลี่ยนเดือนเมื่อกดปุ่ม ก่อนหน้า/ถัดไป และเรียก fetch ใหม่", async () => {
        // [OLD] ลบการ mock แบบ chain ที่เปราะบางนี้ออก
        // global.fetch = vi
        //     .fn()
        //     .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" })
        //     .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" })
        //     .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" });

        // [NEW] ใช้ helper ที่สร้าง mock แบบถาวร (persistent)
        // มันจะตอบกลับเป็น [] ทุกครั้งที่ถูกเรียก ไม่ว่าจะกี่ครั้งก็ตาม
        mockFetchResolveOnce([]);

        // [NEW] สั่งเคลียร์ mock เผื่อมี test อื่นเรียกค้างไว้ (แม้ beforeEach จะทำแล้วก็ตาม)
        (global.fetch as any).mockClear();


        render(
            <MemoryRouter>
                <Month />
            </MemoryRouter>
        );

        // รอให้โหลดรอบแรกจบ (ข้อความกำลังโหลดหาย)
        await waitFor(() => {
            const still = screen.queryAllByText((_, node) =>
                !!node?.textContent?.toLowerCase().includes("load") ||
                !!node?.textContent?.includes("กำลังโหลด")
            );
            expect(still.length).toBe(0);
        }, { timeout: 3000 });

        const getChipText = () =>
            (document.querySelector(".month-chip") as HTMLElement)?.textContent?.trim() ?? "";

        const initialText = getChipText();
        expect(initialText).not.toBe("");

        // [NEW] เก็บจำนวนการเรียกครั้งแรก
        const initialCalls = (global.fetch as any).mock.calls.length;
        expect(initialCalls).toBeGreaterThanOrEqual(1);

        // previous
        fireEvent.click(screen.getByRole("button", { name: "ก่อนหน้า" }));
        await waitFor(() => {
            expect(getChipText()).not.toBe(initialText);
        }, { timeout: 3000 });

        // [NEW] เช็กว่ามีการเรียก fetch เพิ่ม
        const prevCalls = (global.fetch as any).mock.calls.length;
        expect(prevCalls).toBeGreaterThan(initialCalls);


        // next (กลับมาเท่าเดิม)
        fireEvent.click(screen.getByRole("button", { name: "ถัดไป" }));
        await waitFor(() => {
            expect(getChipText()).toBe(initialText);
        }, { timeout: 3000 });

        // [MODIFIED] แก้การนับจำนวนครั้งให้แม่นยำขึ้น
        // เราคาดหวังว่า fetch จะถูกเรียกอย่างน้อย 3 ครั้ง (initial + prev + next)
        // หรืออย่างน้อยก็ต้องมากกว่าตอนที่กด prev
        await waitFor(() => {
            expect((global.fetch as any).mock.calls.length).toBeGreaterThan(prevCalls);
        }, { timeout: 3000 });

        // หรือจะเช็กยอดรวมก็ได้
        expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(3);
    });
});


});