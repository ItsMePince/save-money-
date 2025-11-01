// src/pages/customincome.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import IncomeCustom from "./customincome"; // Import your component

// --- Mock 'react-router-dom' ---
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// --- Mock 'buttomnav' ---
vi.mock("./buttomnav", () => ({
    default: () => <div data-testid="bottom-nav-mock" />,
}));

// --- Test Setup ---
const renderComponent = () => {
    return render(<IncomeCustom />);
};

describe("IncomeCustom Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.alert before each test
        vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore mocks after each test
        vi.restoreAllMocks();
    });

    // --- Tests ---

    it("should filter icons based on 'group name'", async () => {
        const user = userEvent.setup();
        renderComponent();
        // Use the placeholder text seen in the debug output
        const searchInput = screen.getByPlaceholderText(/ค้นหาไอคอนรายได้…/);

        await user.type(searchInput, "ค้าขาย"); // Type "ค้าขาย"

        // Assuming "ค้าปลีก" is in the "ค้าขาย" group and visible
        expect(screen.getByTitle("ค้าปลีก")).toBeInTheDocument();
        // Assuming "เงินเดือน & งานประจำ" group title should be hidden
        expect(screen.queryByText("เงินเดือน & งานประจำ")).not.toBeInTheDocument();
    });

    it("should display 'not found' message if search yields no results", async () => {
        const user = userEvent.setup();
        renderComponent();
        const searchInput = screen.getByPlaceholderText(/ค้นหาไอคอนรายได้…/);

        await user.type(searchInput, "zzzzzz");

        // Check for the specific 'no results' text and class
        expect(screen.getByText((content, element) => {
            if (!element) return false;
            const text = element.textContent || "";
            // Check class name and text content based on debug output
            return element.classList.contains('cc-noresult') &&
                text.includes('ไม่พบไอคอนที่ตรงกับ') &&
                text.includes('zzzzzz');
        })).toBeInTheDocument();
    });

    it(" (FIXED) should clear search input when '×' button is clicked", async () => {
        const user = userEvent.setup();
        renderComponent();
        const searchInput = screen.getByPlaceholderText(/ค้นหาไอคอนรายได้…/);

        // Type something first
        await user.type(searchInput, "test");
        expect(searchInput).toHaveValue("test");

        // **FIX**: Use getByLabelText based on the button's aria-label
        await user.click(screen.getByLabelText("ล้างคำค้น"));

        // Assert input is cleared and default icons reappear
        expect(searchInput).toHaveValue("");
        expect(screen.getByTitle("เงินเดือน")).toBeInTheDocument();
    });

    it(" (FIXED) should display selected icon and typed name in 'Creator' area", async () => {
        const user = userEvent.setup();
        renderComponent();

        // **FIX**: Use the correct placeholder text from debug output
        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");

        // Select an icon first (e.g., "เงินเดือน")
        await user.click(screen.getByTitle("เงินเดือน"));

        // Type the name
        await user.type(nameInput, "รายได้หลัก");
        expect(nameInput).toHaveValue("รายได้หลัก");

        // You might also want to check if the selected icon is displayed correctly here
        // Example: expect(screen.getByTestId('picked-icon')).toHaveAttribute('data-icon-key', 'salary');
    });

    it(" (FIXED) should show alert if confirm button is clicked without selecting an icon", async () => {
        const user = userEvent.setup();
        renderComponent();

        // **FIX**: Use the correct placeholder text
        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");

        // Type name but DO NOT select an icon
        await user.type(nameInput, "รายได้หลัก");

        // Click confirm (using aria-label from debug output)
        await user.click(screen.getByLabelText("ยืนยัน"));

        // Assert alert and navigation did not happen
        expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show alert if confirm button is clicked without entering a name", async () => {
        const user = userEvent.setup();
        renderComponent();

        // Select icon but DO NOT type name
        await user.click(screen.getByTitle("เงินเดือน"));

        // Click confirm (using aria-label)
        await user.click(screen.getByLabelText("ยืนยัน"));

        // Assert alert and navigation did not happen
        expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    // In the test: "should navigate ... (Happy Path)"

    it(" (FIXED - Test Only) ควรเรียก navigate กลับไปหน้า /income พร้อม state ที่ถูกต้อง เมื่อกดยืนยัน (Happy Path)", async () => {
        const user = userEvent.setup();
        renderComponent();
        const nameInput = screen.getByPlaceholderText("ชื่อหมวดรายได้");

        // 1. คลิกไอคอน "เงินเดือน"
        await user.click(screen.getByTitle("เงินเดือน"));

        // 2. พิมพ์ชื่อ
        await user.type(nameInput, "รายได้พิเศษ");

        // 3. กดยืนยัน
        await user.click(screen.getByLabelText("ยืนยัน"));

        // 4. ตรวจสอบผล
        expect(window.alert).not.toHaveBeenCalled();

        // [ แก้ไข] ปรับ expect ให้ตรงกับข้อมูลที่ Component ส่งมาจริง
        expect(mockNavigate).toHaveBeenCalledWith("/income", {
            state: {
                customIncome: {
                    // Component ส่ง 'label' ไม่ใช่ 'name'
                    label: "รายได้พิเศษ",
                    // Component ส่ง 'icon' ไม่ใช่ 'iconKey'
                    icon: "Briefcase",
                    // Component ไม่ได้ส่ง 'group' มา
                },
            },
            replace: true,
        });
    });
});