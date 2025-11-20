import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RepeatedTransactions from "./RepeatedTransactions";

// ===== GLOBAL FIX FOR WINDOW (Vitest jsdom) =====
if (!globalThis.window) {
    (globalThis as any).window = globalThis;
}
window.confirm = vi.fn(() => true);

// --- Mock Child (เบาสุด) ---
vi.mock("./AddTransaction", () => ({
    default: ({ onCancel, onSubmit }: any) => (
        <div data-testid="mock-form">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={() => onSubmit({ name: "X" })}>Submit</button>
        </div>
    ),
}));

// Mock data
const mockList = [
    { id: 1, name: "Netflix", account: "KBank", amount: 199, date: "2025-01-02", frequency: "MONTHLY" },
];

// ช่วย render
const renderPage = () =>
    render(
        <MemoryRouter>
            <RepeatedTransactions />
        </MemoryRouter>
    );

// --- Test Suite ---
describe("RepeatedTransactions Page (minimal)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();

        // mock fetch default (response = [])
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        // mock confirm
        window.confirm = vi.fn(() => true);
    });

    it("โหลดแล้ว fetch API", async () => {
        renderPage();

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("แสดงข้อความว่างเมื่อไม่มีรายการ", async () => {
        renderPage();

        expect(
            await screen.findByText(/ยังไม่มีรายการธุรกรรม/i)
        ).toBeInTheDocument();
    });

    it("แสดงรายการเมื่อ API มีข้อมูล", async () => {
        // ทำให้ fetch ครั้งแรก return mockList
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockList,
        });

        renderPage();

        expect(await screen.findByText("Netflix")).toBeInTheDocument();
    });

    it("เปิดฟอร์มเมื่อกดปุ่ม +", async () => {
        renderPage();

        fireEvent.click(screen.getByText("+"));

        expect(await screen.findByTestId("mock-form")).toBeInTheDocument();
    });

    it("ปิดฟอร์มเมื่อกด cancel", async () => {
        renderPage();

        // เปิดฟอร์ม
        fireEvent.click(screen.getByText("+"));

        // กด cancel
        fireEvent.click(await screen.findByText("Cancel"));

        await waitFor(() => {
            expect(screen.queryByTestId("mock-form")).not.toBeInTheDocument();
        });
    });
});
