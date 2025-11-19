// src/pages/customincome.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import IncomeCustom from "./customincome";

// mock router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// mock BottomNav
vi.mock("./buttomnav", () => ({
    default: () => <div data-testid="bottomnav" />,
}));

describe("IncomeCustom Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    const setup = () => userEvent.setup();

    // ----------------------------------------------------------
    it("filter icons by group name", async () => {
        const user = setup();
        render(<IncomeCustom />);

        const search = screen.getByPlaceholderText("ค้นหา...");

        await user.type(search, "ค้าขาย");

        // ควรแสดงกลุ่มนี้
        expect(screen.getByText("ค้าขาย & ออนไลน์")).toBeInTheDocument();

        // และ icon ในกลุ่มนี้ควรยังอยู่ เช่น "ค้าปลีก"
        expect(screen.getByTitle("ค้าปลีก")).toBeInTheDocument();

        // กลุ่มอื่นควรหาย เช่น เงินเดือน
        expect(screen.queryByText("เงินเดือน & งานประจำ")).not.toBeInTheDocument();
    });

    // ----------------------------------------------------------
    it("show not-found message when no results", async () => {
        const user = setup();
        render(<IncomeCustom />);

        const search = screen.getByPlaceholderText("ค้นหา...");

        await user.type(search, "zzzzzzz");

        // หา element ที่มี class cc-noresult
        const noResult = screen.getByText((txt, el) => {
            if (!el) return false;
            return el.classList.contains("cc-noresult");
        });

        expect(noResult).toBeInTheDocument();
        expect(noResult.textContent).toContain("ไม่พบ");
    });

    // ----------------------------------------------------------
    it("clear search when clicking ×", async () => {
        const user = setup();
        render(<IncomeCustom />);

        const search = screen.getByPlaceholderText("ค้นหา...");

        // ใส่ข้อความก่อน
        await user.type(search, "abc");
        expect(search).toHaveValue("abc");

        // ปุ่ม clear คือ ×
        await user.click(screen.getByRole("button", { name: "×" }));

        expect(search).toHaveValue("");

        // ไอคอน default ต้องกลับมา
        expect(screen.getByTitle("เงินเดือน")).toBeInTheDocument();
    });

    // ----------------------------------------------------------
    it("selected icon + typed name appears in creator area", async () => {
        const user = setup();
        render(<IncomeCustom />);

        // เลือก "เงินเดือน"
        await user.click(screen.getByTitle("เงินเดือน"));

        // ใส่ชื่อ
        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");
        await user.type(nameInput, "รายได้หลัก");

        expect(nameInput).toHaveValue("รายได้หลัก");
    });

    // ----------------------------------------------------------
    it("alert if confirm clicked without icon", async () => {
        const user = setup();
        render(<IncomeCustom />);

        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");
        await user.type(nameInput, "ABC");

        // ปุ่ม confirm คือปุ่มที่มี icon Check → role button
        const confirmBtn = screen.getByRole("button", { name: "ยืนยัน" });

        await user.click(confirmBtn);

        expect(window.alert).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    it("alert if confirm clicked without name", async () => {
        const user = setup();
        render(<IncomeCustom />);

        // เลือก icon
        await user.click(screen.getByTitle("เงินเดือน"));

        const confirmBtn = screen.getByRole("button", { name: "ยืนยัน" });
        await user.click(confirmBtn);

        expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // ----------------------------------------------------------
    it("navigate('/income') with correct state (Happy Path)", async () => {
        const user = setup();
        render(<IncomeCustom />);

        // เลือก icon เงินเดือน (iconName = "Briefcase")
        await user.click(screen.getByTitle("เงินเดือน"));

        // ใส่ชื่อ
        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");
        await user.type(nameInput, "รายได้พิเศษ");

        const confirm = screen.getByRole("button", { name: "ยืนยัน" });
        await user.click(confirm);

        expect(window.alert).not.toHaveBeenCalled();

        expect(mockNavigate).toHaveBeenCalledWith("/income", {
            state: {
                customIncome: {
                    label: "รายได้พิเศษ",
                    icon: "Briefcase",  // ← มาจาก iconName
                },
            },
            replace: true,
        });
    });
});
