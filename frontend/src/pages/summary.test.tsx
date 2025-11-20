// src/pages/Summary.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Summary from "./summary";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
    fetchAllTransactions: vi.fn(),
    API_BASE: "http://localhost:8000",
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockNavigate = vi.fn();

function mockFetchReturn(data: any, ok = true) {
    global.fetch = vi.fn().mockResolvedValue({
        ok,
        json: async () => data,
    }) as any;
}

describe("Summary Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("แสดง Loading ตอนเริ่มโหลด", () => {
        (api.fetchAllTransactions as any).mockResolvedValue([]);
        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );
        expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();
    });

    it("แสดงข้อความ error เมื่อ fetch fail", async () => {
        (api.fetchAllTransactions as any).mockRejectedValue(new Error("เซิร์ฟเวอร์พัง"));

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        expect(await screen.findByText(/เซิร์ฟเวอร์พัง/i)).toBeInTheDocument();
    });

    it("โหลดข้อมูลสำเร็จแล้วแสดง day-card พร้อมรายการ", async () => {
        (api.fetchAllTransactions as any).mockResolvedValue([
            {
                id: 1,
                category: "อาหาร",
                type: "EXPENSE",
                amount: 100,
                date: "2025-01-10",
                paymentMethod: "เงินสด",
            },
            {
                id: 2,
                category: "ของขวัญ",
                type: "INCOME",
                amount: 300,
                date: "2025-01-10",
                paymentMethod: "SCB",
            },
        ]);

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        expect(await screen.findByText(/อาหาร/i)).toBeInTheDocument();
        expect(screen.getByText(/ของขวัญ/i)).toBeInTheDocument();

        // รวม 2 รายการ ในวันเดียว
        expect(screen.getByText(/รวม:/i)).toBeInTheDocument();
    });

    it("คลิก row แล้วเปิด detail overlay", async () => {
        (api.fetchAllTransactions as any).mockResolvedValue([
            {
                id: 1,
                category: "อาหาร",
                type: "EXPENSE",
                amount: 150,
                date: "2025-01-11",
                paymentMethod: "เงินสด",
            },
        ]);

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        // รอจนข้อมูลโหลดเสร็จ
        const title = await screen.findByText("อาหาร");

        // หา row แท้ ๆ
        const row = title.closest(".row");
        expect(row).not.toBeNull();

        fireEvent.click(row!);

        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });


    it("กดปุ่ม X แล้วปิด overlay", async () => {
        (api.fetchAllTransactions as any).mockResolvedValue([
            {
                id: 1,
                category: "อาหาร",
                type: "EXPENSE",
                amount: 150,
                date: "2025-01-11",
                paymentMethod: "เงินสด",
            },
        ]);

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        await waitFor(() => fireEvent.click(screen.getByText("อาหาร")));

        const closeBtn = screen.getByRole("button", { name: /ปิด/i });
        fireEvent.click(closeBtn);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("คลิกแก้ไข → navigate ถูกเรียก", async () => {
        (api.fetchAllTransactions as any).mockResolvedValue([
            {
                id: 1,
                category: "อาหาร",
                type: "EXPENSE",
                amount: 150,
                date: "2025-01-11",
                paymentMethod: "เงินสด",
            },
        ]);

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        await waitFor(() => fireEvent.click(screen.getByText("อาหาร")));

        fireEvent.click(screen.getByRole("button", { name: /แก้ไข/i }));

        expect(mockNavigate).toHaveBeenCalled();
        expect(mockNavigate.mock.calls[0][0]).toMatch(/expense-edit|income-edit/);
    });

    it("กดลบแล้ว fetch DELETE ถูกเรียก", async () => {
        mockFetchReturn({}, true);

        (api.fetchAllTransactions as any).mockResolvedValue([
            {
                id: 5,
                category: "กาแฟ",
                type: "EXPENSE",
                amount: 80,
                date: "2025-01-12",
                paymentMethod: "เงินสด",
            },
        ]);

        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(
            <MemoryRouter>
                <Summary />
            </MemoryRouter>
        );

        await waitFor(() => fireEvent.click(screen.getByText("กาแฟ")));

        fireEvent.click(screen.getByRole("button", { name: /ลบ/i }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });

        const [url, opts] = (global.fetch as any).mock.calls[0];

        expect(opts.method).toBe("DELETE");
        expect(url).toBe("http://localhost:8000/expenses/5");
    });
});
