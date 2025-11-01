// AddTransaction.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AddTransaction, { TransactionFormData } from "./AddTransaction"; // Import คอมโพเนนท์ของคุณ

// --- Mock Callbacks ---
const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

// --- Mock localStorage ---
let localStorageStore: Record<string, string> = {};
const mockLocalStorage = {
    getItem: (key: string) => localStorageStore[key] || null,
    setItem: (key: string, value: string) => {
        localStorageStore[key] = value.toString();
    },
    clear: () => {
        localStorageStore = {};
    },
    removeItem: (key: string) => {
        delete localStorageStore[key];
    }
};

// --- Mock Data ---
const mockAccounts = [
    { name: "บัญชี SCB", amount: 10000, type: "ธนาคาร" }, // เพิ่ม type เผื่อ component ใช้
    { name: "บัญชี KBank", amount: 5000, type: "ธนาคาร" },
];

// --- Helper Functions ---
function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatDateToDDMMYYYY(dateString: string): string {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) {
        return ''; // Return empty or handle error
    }
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}
// --------------------------------------------------

// --- Test Setup ---
const renderComponent = (props: Partial<React.ComponentProps<typeof AddTransaction>> = {}) => {
    return render(
        <AddTransaction
            onCancel={mockOnCancel}
            onSubmit={mockOnSubmit}
            {...props}
        />
    );
};

describe("AddTransaction Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageStore = {};

        // Stub globals
        vi.stubGlobal("localStorage", mockLocalStorage);
        vi.spyOn(window, "alert").mockImplementation(() => {});

        // ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ ⬇️
        //  [FIX] Mock fetch และ stub it as the global
        // นี่คือส่วนที่ขาดไป!!!
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockAccounts,
            text: async () => JSON.stringify(mockAccounts),
        });
        vi.stubGlobal("fetch", mockFetch);
        // ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ ⬆️

        // ใส่ localStorage (เผื่อ component ยังอ่านอยู่)
        localStorage.setItem("accounts", JSON.stringify(mockAccounts));
    });

    afterEach(() => {
        // vi.restoreAllMocks() จะคืนค่า fetch และ localStorage ให้
        vi.restoreAllMocks();
    });

    // --- Tests ---
    // โค้ด Test (it block) ทั้งหมดข้างล่างนี้ "ถูกต้องแล้ว"
    // ไม่จำเป็นต้องแก้ไข Test case ... ปัญหาอยู่ที่ beforeEach

    it(" (FIXED) ควร render หน้า 'เพิ่มธุรกรรม' (Create Mode) ได้ถูกต้อง", async () => {
        renderComponent({ isEditing: false });

        expect(screen.getByText("เพิ่มธุรกรรมที่เกิดซ้ำ")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "ยืนยัน" })).toBeInTheDocument();

        const dateInput = await screen.findByDisplayValue(getTodayDate());
        expect(dateInput).toBeInTheDocument();

        const selects = await screen.findAllByRole("combobox");

        // เมื่อ fetch mock ทำงาน, dropdown จะมีค่า
        expect(selects[0]).toHaveValue("");
        expect(selects[1]).toHaveValue("ทุกเดือน");
    });

    it(" (FIXED) ควร render หน้า 'แก้ไขธุรกรรม' (Edit Mode) พร้อมข้อมูลเริ่มต้น", async () => {
        const initialData: TransactionFormData = {
            name: "ค่าเน็ต",
            account: "บัญชี KBank",
            amount: "599",
            date: "25/12/2025", // DD/MM/YYYY
            frequency: "ทุกเดือน"
        };
        renderComponent({ initialData, isEditing: true });

        expect(screen.getByText("แก้ไขธุรกรรมที่เกิดซ้ำ")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "บันทึก" })).toBeInTheDocument();

        expect(await screen.findByPlaceholderText("ชื่อธุรกรรม")).toHaveValue("ค่าเน็ต");
        expect(await screen.findByPlaceholderText("บาท")).toHaveValue(599);

        const selects = await screen.findAllByRole("combobox");
        // เมื่อ fetch mock ทำงาน, dropdown จะมีค่า
        expect(selects[0]).toHaveValue("บัญชี KBank");
        expect(selects[1]).toHaveValue("ทุกเดือน");

        const dateInput = await screen.findByDisplayValue("2025-12-25");
        expect(dateInput).toBeInTheDocument();
    });

    it("ควรเรียก onCancel เมื่อกดปุ่ม 'ยกเลิก'", async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(await screen.findByRole("button", { name: "ยกเลิก" }));

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it(" (FIXED) ควรแสดง alert ถ้ากรอกข้อมูลไม่ครบ (เช่น จำนวนเงิน)", async () => {
        const user = userEvent.setup();
        renderComponent({ isEditing: false });

        await user.type(await screen.findByPlaceholderText("ชื่อธุรกรรม"), "ธุรกรรมใหม่");

        const selects = await screen.findAllByRole("combobox");

        // เมื่อ fetch mock ทำงาน, เราจะสามารถเลือก option ได้
        await user.selectOptions(selects[0], "บัญชี KBank");
        await user.selectOptions(selects[1], "ทุกวัน");

        const dateInput = await screen.findByDisplayValue(getTodayDate());
        fireEvent.change(dateInput, { target: { value: '2025-01-01' } });

        // "ไม่กรอก amount"
        await user.click(screen.getByRole("button", { name: "ยืนยัน" }));

        expect(window.alert).toHaveBeenCalledTimes(1);
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("กรุณากรอกข้อมูลให้ครบถ้วน"));
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("ควรกรองอินพุต 'จำนวนเงิน' ให้รับเฉพาะตัวเลขบวก", async () => {
        renderComponent();
        const amountInput = await screen.findByPlaceholderText("บาท");

        fireEvent.change(amountInput, { target: { value: "abc" } });
        expect(amountInput).toHaveValue(null);

        fireEvent.change(amountInput, { target: { value: "-123" } });
        expect(amountInput).toHaveValue(null);

        fireEvent.change(amountInput, { target: { value: "789" } });
        expect(amountInput).toHaveValue(789);

        fireEvent.change(amountInput, { target: { value: "789.5" } });
        expect(amountInput).toHaveValue(789);

        fireEvent.change(amountInput, { target: { value: "099" } });
        expect(amountInput).toHaveValue(99);

        fireEvent.change(amountInput, { target: { value: "0" } });
        expect(amountInput).toHaveValue(0);

              fireEvent.change(amountInput, { target: { value: "" } });
        expect(amountInput).toHaveValue(null);
    });

    it(" (FIXED) ควรเรียก onSubmit พร้อมข้อมูลที่ถูกต้อง (Create Mode)", async () => {
        const user = userEvent.setup();
        renderComponent({ isEditing: false });

        const expectedDateInput = '2025-11-10';
        const expectedDateOutput = '10/11/2025'; // DD/MM/YYYY

        await user.type(await screen.findByPlaceholderText("ชื่อธุรกรรม"), "ค่ากาแฟ");
        fireEvent.change(screen.getByPlaceholderText("บาท"), { target: { value: "80" } });

        const selects = await screen.findAllByRole("combobox");

        // เมื่อ fetch mock ทำงาน, เราจะสามารถเลือก option ได้
        await user.selectOptions(selects[0], "บัญชี KBank");
        await user.selectOptions(selects[1], "ทุกวัน");

        const form = selects[0].closest('form');
        const dateInput = await screen.findByDisplayValue(getTodayDate());
        expect(dateInput).toBeInTheDocument();
        fireEvent.change(dateInput!, { target: { value: expectedDateInput } });

        await user.click(screen.getByRole("button", { name: "ยืนยัน" }));

        const expectedData: TransactionFormData = {
            name: "ค่ากาแฟ",
            account: "บัญชี KBank",
            amount: "80",
            date: expectedDateOutput,
            frequency: "ทุกวัน"
        };

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(expectedData);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("ควรเรียก onSubmit พร้อมข้อมูลที่อัปเดต (Edit Mode)", async () => {
        const user = userEvent.setup();
        const initialData: TransactionFormData = {
            name: "ค่าเน็ต",
            account: "บัญชี SCB",
            amount: "599",
            date: "25/12/2025", // DD/MM/YYYY
            frequency: "ทุกเดือน"
        };
        renderComponent({ initialData, isEditing: true });

        const nameInput = await screen.findByPlaceholderText("ชื่อธุรกรรม");
        await user.clear(nameInput);
        await user.type(nameInput, "ค่าเน็ต (แพงขึ้น)");

        const amountInput = screen.getByPlaceholderText("บาท");
        fireEvent.change(amountInput, { target: { value: "699" } });

        const selects = await screen.findAllByRole("combobox");
        await user.selectOptions(selects[1], "ทุกปี"); // Frequency

        const dateInput = await screen.findByDisplayValue("2025-12-25");
        fireEvent.change(dateInput!, { target: { value: '2026-01-15' } });

        await user.click(screen.getByRole("button", { name: "บันทึก" }));

        const expectedData: TransactionFormData = {
            name: "ค่าเน็ต (แพงขึ้น)",
            account: "บัญชี SCB",
            amount: "699",
            date: "15/01/2026", // DD/MM/YYYY
            frequency: "ทุกปี"
        };

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(expectedData);
        expect(window.alert).not.toHaveBeenCalled();
    });
});