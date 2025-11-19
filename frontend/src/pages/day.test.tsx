// src/pages/day.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Day from "./day";

// mock recharts
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: ({ children }: any) => <div>{children}</div>,
    Pie: ({ children }: any) => <div>{children}</div>,
    Cell: () => <div></div>,
    Tooltip: () => null,
}));

// helper: mock fetch
const mockFetch = (data: any[], ok = true) => {
    global.fetch = vi.fn(async () =>
        ok
            ? new Response(JSON.stringify(data), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
            : new Response(null, { status: 404 })
    );
};

// helper: render
const renderDay = (date = "2025-09-24") =>
    render(
        <MemoryRouter initialEntries={[`/day?date=${date}`]}>
            <Day />
        </MemoryRouter>
    );

// helper: extract TH date from date-chip
const readDate = () => {
    const chip = screen.getByText((content, node) => {
        // match dd/mm/yyyy (พ.ศ.)
        return /\d{2}\/\d{2}\/\d{4}/.test(node?.textContent || "");
    });
    return chip.textContent?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || "";
};

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("Day Page (Clean Version)", () => {

    it("แสดงสถานะ loading ตอนแรก", async () => {
        mockFetch([]);
        renderDay();

        expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();

        await waitFor(() =>
            expect(screen.queryByText(/กำลังโหลดข้อมูล/i)).not.toBeInTheDocument()
        );
    });

    it("แสดง error ถ้าโหลดล้มเหลว", async () => {
        mockFetch([], false);
        renderDay();

        await waitFor(() =>
            expect(
                screen.getByText(/โหลดรายการไม่สำเร็จ|เกิดข้อผิดพลาด/i)
            ).toBeInTheDocument()
        );
    });

    it("แสดงวันนี้ยังไม่มีรายการ เมื่อไม่มีข้อมูล", async () => {
        mockFetch([]);
        renderDay();

        await waitFor(() =>
            expect(
                screen.getByText(/วันนี้ยังไม่มีรายการ/i)
            ).toBeInTheDocument()
        );
    });

    it("แสดงผลเมื่อมี expenses", async () => {
        const day = "2025-09-24";
        mockFetch([
            {id: 1, type: "EXPENSE", category: "อาหาร", amount: 120, date: day},
            {id: 2, type: "EXPENSE", category: "เดินทาง", amount: 80, date: day},
        ]);

        renderDay(day);

        await waitFor(() =>
            expect(screen.getByText("อาหาร")).toBeInTheDocument()
        );

        expect(screen.getByText(/120/)).toBeInTheDocument();
        expect(screen.getByText(/80/)).toBeInTheDocument();
    });

    it("เปลี่ยนวันเมื่อกด ก่อนหน้า และ ถัดไป", async () => {
        mockFetch([]);
        const user = userEvent.setup();

        renderDay("2025-09-24");

        // ใช้ querySelector แทน เพื่อเลือกได้แม่นยำกว่า
        const getChipDate = () => {
            const chip = document.querySelector('.date-chip'); // ปรับ selector ตาม class จริง
            return chip?.textContent?.trim() || "";
        };

        // หรือใช้ data-testid
        // const getChipDate = () => screen.getByTestId('date-display').textContent!.trim();

        // รอให้โหลดวันสำเร็จ
        await waitFor(() => {
            expect(getChipDate()).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        });

        const startDate = getChipDate();

        // ➡ ถัดไป
        const nextBtn = screen.getByRole("button", {name: /ถัดไป/i});
        await user.click(nextBtn);

        await waitFor(() => {
            expect(getChipDate()).not.toBe(startDate);
        });

        // ⬅ กลับวันเดิม
        const prevBtn = screen.getByRole("button", {name: /ก่อนหน้า/i});
        await user.click(prevBtn);

        await waitFor(() => {
            expect(getChipDate()).toBe(startDate);
        });
    });
    });