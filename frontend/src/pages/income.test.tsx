import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Income from "./income";
import { BrowserRouter as Router } from "react-router-dom";

// Mock navigate and location
const mockNavigate = vi.fn();
const mockLocation = { state: null, pathname: "/income" };

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Mock PaymentMethodContext
const mockSetPayment = vi.fn();
vi.mock("../PaymentMethodContext", () => ({
  usePaymentMethod: () => ({
    payment: null,
    setPayment: mockSetPayment,
  }),
}));

// Mock the useEditPrefill hook
vi.mock("../hooks/useEditPrefill", () => ({
  useEditPrefill: vi.fn(),
}));

describe("Income Component", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockSetPayment.mockClear();

    // Mock global alert
    global.alert = vi.fn();

    render(
      <Router>
        <Income />
      </Router>
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the component correctly", () => {
    expect(screen.getByText("รายได้")).toBeInTheDocument();
  });

  it("should change category to 'ค่าขนม' when the 'ค่าขนม' button is clicked", async () => {
    const categoryButtons = screen.getAllByText("ค่าขนม");
    const categoryButton = categoryButtons[0].closest("button");

    await userEvent.click(categoryButton!);

    // Verify category button has active class
    expect(categoryButton).toHaveClass("active");
  });

  it("should update amount when typing into the amount input", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");

    // Clear first, then type
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "500");

    // Check if the amount is updated
    expect(amountInput).toHaveValue("500");
  });

  it("should open date-time picker when clicked", async () => {
    // Find the button that opens date picker
    const dateText = screen.getByText(/น\./);
    const dateButton = dateText.closest("button");

    // Mock showPicker function
    const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
    const dateInput = dateInputs[0] as HTMLInputElement;
    const mockShowPicker = vi.fn();
    (dateInput as any).showPicker = mockShowPicker;

    await userEvent.click(dateButton!);

    // Verify showPicker was called
    expect(mockShowPicker).toHaveBeenCalled();
  });

  it("should show an alert when the confirm button is clicked without necessary fields", async () => {
    // Find the confirm button (the one with ok-btn class)
    const confirmButton = document.querySelector(".ok-btn");

    await userEvent.click(confirmButton!);

    // Check if alert is called with correct message
    expect(global.alert).toHaveBeenCalledWith("Required ❌");
  });

  it("should update the note field when typed into", async () => {
    const noteInput = screen.getByPlaceholderText("โน้ต");
    await userEvent.type(noteInput, "Test Note");

    // Verify if note input updates correctly
    expect(noteInput).toHaveValue("Test Note");
  });

  it("should trigger saving draft on amount change", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");

    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "1000");

    // Verify draft is saved in sessionStorage
    const draft = JSON.parse(sessionStorage.getItem("income_draft_v2") || "{}");
    expect(draft.amount).toBe("1000");
  });

  // === เพิ่ม: การเปลี่ยนหมวดหมู่อื่นๆ ===

  it("should change category to 'ทำงาน' when the 'ทำงาน' button is clicked", async () => {
    const categoryButtons = screen.getAllByText("ทำงาน");
    const categoryButton = categoryButtons[0].closest("button");

    await userEvent.click(categoryButton!);

    expect(categoryButton).toHaveClass("active");
  });

  it("should change category to 'ลงทุน' when the 'ลงทุน' button is clicked", async () => {
    const categoryButtons = screen.getAllByText("ลงทุน");
    const categoryButton = categoryButtons[0].closest("button");

    await userEvent.click(categoryButton!);

    expect(categoryButton).toHaveClass("active");
  });

  it("should navigate to custom income page when 'อื่นๆ' button is clicked", async () => {
    const categoryButtons = screen.getAllByText("อื่นๆ");
    const categoryButton = categoryButtons[0].closest("button");

    await userEvent.click(categoryButton!);

    expect(mockNavigate).toHaveBeenCalledWith("/customincome");
  });

  // === เพิ่ม: การกด keypad ===

  it("should update amount when clicking number key on keypad", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");
    const keyButton = screen.getByText("5");

    await userEvent.click(keyButton);

    expect(amountInput).toHaveValue("5");
  });

  it("should add decimal point when clicking '.' on keypad", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");
    const key5 = screen.getByText("5");
    const keyDot = screen.getByText(".");
    const key2 = screen.getByText("2");

    await userEvent.click(key5);
    await userEvent.click(keyDot);
    await userEvent.click(key2);

    expect(amountInput).toHaveValue("5.2");
  });

  it("should delete last digit when clicking backspace on keypad", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");

    // Type some numbers first
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "123");

    // Click backspace button
    const backspaceButton = document.querySelector(".key.danger");
    await userEvent.click(backspaceButton!);

    expect(amountInput).toHaveValue("12");
  });

  it("should build number sequence using keypad", async () => {
    const amountInput = screen.getByLabelText("จำนวนเงิน");

    // Click: 1 -> 2 -> 3
    await userEvent.click(screen.getByText("1"));
    await userEvent.click(screen.getByText("2"));
    await userEvent.click(screen.getByText("3"));

    expect(amountInput).toHaveValue("123");
  });

  // === เพิ่ม: การแก้ไขข้อมูลเดิม (edit mode) ===

  it("should load existing data in edit mode", () => {
    // Clean up first
    sessionStorage.clear();

    // Set edit ID and draft data to simulate edit mode
    sessionStorage.setItem("edit_id_income", "test-id-123");
    sessionStorage.setItem("income_draft_v2", JSON.stringify({
      category: "ทำงาน",
      amount: "5000",
      note: "เงินเดือน",
      place: "บริษัท ABC",
      dt: "2025-01-15T09:00"
    }));

    // Render new instance with edit data
    const { container } = render(
      <Router>
        <Income />
      </Router>
    );

    const amountInput = container.querySelector('input[aria-label="จำนวนเงิน"]') as HTMLInputElement;
    const noteInput = container.querySelector('input[placeholder="โน้ต"]') as HTMLInputElement;
    const placeInput = container.querySelector('input[placeholder="สถานที่"]') as HTMLInputElement;

    expect(amountInput?.value).toBe("5000");
    expect(noteInput?.value).toBe("เงินเดือน");
    expect(placeInput?.value).toBe("บริษัท ABC");
  });

  it("should preserve draft data across page reloads", async () => {
    // Set draft data
    const draftData = {
      category: "ลงทุน",
      amount: "10000",
      note: "หุ้น",
      place: "ตลาดหลักทรัพย์"
    };
    sessionStorage.setItem("income_draft_v2", JSON.stringify(draftData));

    // Re-render to load draft
    render(
      <Router>
        <Income />
      </Router>
    );

    const amountInput = screen.getAllByLabelText("จำนวนเงิน")[1]; // Get second render
    const noteInput = screen.getAllByPlaceholderText("โน้ต")[1];

    expect(amountInput).toHaveValue("10000");
    expect(noteInput).toHaveValue("หุ้น");
  });
});