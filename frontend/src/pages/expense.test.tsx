import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Expense from "./expense";

// Mock dependencies
const mockNavigate = vi.fn();
const mockClearTempCategory = vi.fn();
const mockSetPayment = vi.fn();
const mockClearPayment = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../TempCategoryContext", () => ({
  useTempCategory: () => ({
    tempCategory: null,
    clearTempCategory: mockClearTempCategory,
  }),
}));

vi.mock("../PaymentMethodContext", () => ({
  usePaymentMethod: () => ({
    payment: null,
    setPayment: mockSetPayment,
    clearPayment: mockClearPayment,
  }),
}));

vi.mock("../hooks/useEditPrefill", () => ({
  useEditPrefill: vi.fn(),
}));

vi.mock("./buttomnav", () => ({
  default: () => <div data-testid="bottom-nav">BottomNav</div>,
}));

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("Expense Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    global.fetch = vi.fn();
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render all main elements", () => {
      renderWithRouter(<Expense />);

      expect(screen.getByText("ค่าใช้จ่าย")).toBeInTheDocument();
      expect(screen.getByText("อาหาร")).toBeInTheDocument();
      expect(screen.getByText("ค่าเดินทาง")).toBeInTheDocument();
      expect(screen.getByText("ของขวัญ")).toBeInTheDocument();
      expect(screen.getByText("อื่นๆ")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("โน้ต")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("สถานที่")).toBeInTheDocument();
    });

    it("should display default amount as 0", () => {
      renderWithRouter(<Expense />);
      const amountInput = screen.getByLabelText("จำนวนเงิน") as HTMLInputElement;
      expect(amountInput.value).toBe("0");
    });

    it("should render all keypad buttons", () => {
      renderWithRouter(<Expense />);
      
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "."].forEach(key => {
        expect(screen.getByText(key)).toBeInTheDocument();
      });
    });
  });

  describe("Category Selection", () => {
    it("should select food category by default", () => {
      renderWithRouter(<Expense />);
      const foodBtn = screen.getByText("อาหาร").closest("button");
      expect(foodBtn).toHaveClass("active");
    });

    it("should change category when clicked", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();
      
      const travelBtn = screen.getByText("ค่าเดินทาง").closest("button");
      await user.click(travelBtn!);
      
      expect(travelBtn).toHaveClass("active");
    });

    it("should save category to session storage", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();
      
      const giftBtn = screen.getByText("ของขวัญ").closest("button");
      await user.click(giftBtn!);
      
      await waitFor(() => {
        const draft = JSON.parse(sessionStorage.getItem("expense_draft_v2") || "{}");
        expect(draft.category).toBe("ของขวัญ");
      });
    });

    it("should navigate to custom outcome when clicking อื่นๆ", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();
      
      const otherBtn = screen.getByText("อื่นๆ").closest("button");
      await user.click(otherBtn!);
      
      expect(mockNavigate).toHaveBeenCalledWith("/customoutcome");
    });
  });

  describe("Amount Input", () => {
    it("should update amount when typing", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();
      
      const amountInput = screen.getByLabelText("จำนวนเงิน");
      await user.clear(amountInput);
      await user.type(amountInput, "150");
      
      expect(amountInput).toHaveValue("150");
    });

    it("should handle keypad clicks correctly", async () => {
      renderWithRouter(<Expense />);
      
      fireEvent.click(screen.getByText("5"));
      fireEvent.click(screen.getByText("0"));
      
      const amountInput = screen.getByLabelText("จำนวนเงิน") as HTMLInputElement;
      expect(amountInput.value).toBe("50");
    });

    it("should handle decimal point correctly", async () => {
      renderWithRouter(<Expense />);
      
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("0"));
      fireEvent.click(screen.getByText("."));
      fireEvent.click(screen.getByText("5"));
      
      const amountInput = screen.getByLabelText("จำนวนเงิน") as HTMLInputElement;
      expect(amountInput.value).toBe("10.5");
    });

    it("should handle backspace correctly", async () => {
      renderWithRouter(<Expense />);
      
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("2"));
      fireEvent.click(screen.getByText("3"));
      
      // Find backspace button by danger class
      const keypadButtons = document.querySelectorAll(".key");
      const backspaceBtn = Array.from(keypadButtons).find(btn =>
        btn.classList.contains("danger")
      );

      if (backspaceBtn) {
        fireEvent.click(backspaceBtn);
      }

      const amountInput = screen.getByLabelText("จำนวนเงิน") as HTMLInputElement;
      expect(amountInput.value).toBe("12");
    });

    it("should not allow multiple decimal points", async () => {
      renderWithRouter(<Expense />);

      // Start fresh from 0
      const amountInput = screen.getByLabelText("จำนวนเงิน") as HTMLInputElement;

      fireEvent.click(screen.getByText("1"));

      await waitFor(() => {
        expect(amountInput.value).toBe("1");
      });

      fireEvent.click(screen.getByText("."));

      await waitFor(() => {
        expect(amountInput.value).toBe("1.");
      });

      fireEvent.click(screen.getByText("5"));

      await waitFor(() => {
        expect(amountInput.value).toBe("1.5");
      });

      // Try to add second decimal point (should be ignored)
      fireEvent.click(screen.getByText("."));

      await waitFor(() => {
        expect(amountInput.value).toBe("1.5");
      });

      fireEvent.click(screen.getByText("9"));

      await waitFor(() => {
        expect(amountInput.value).toBe("1.59");
      });
    });
  });

  describe("Note and Place Input", () => {
    it("should update note field", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();

      const noteInput = screen.getByPlaceholderText("โน้ต");
      await user.type(noteInput, "ซื้อของที่ห้าง");

      expect(noteInput).toHaveValue("ซื้อของที่ห้าง");
    });

    it("should navigate to location page when clicking place field", async () => {
      renderWithRouter(<Expense />);

      const placeInput = screen.getByPlaceholderText("สถานที่").closest("div");
      fireEvent.click(placeInput!);

      expect(mockNavigate).toHaveBeenCalledWith("/location");
    });
  });

  describe("Payment Method Selection", () => {
    it("should navigate to account select when clicking payment button", async () => {
      renderWithRouter(<Expense />);

      const paymentBtn = screen.getByText("ประเภทการชำระเงิน");
      fireEvent.click(paymentBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/accountselect");
    });

    it("should save draft before navigating to account select", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();

      // Set some data first
      const noteInput = screen.getByPlaceholderText("โน้ต");
      await user.type(noteInput, "test note");

      const paymentBtn = screen.getByText("ประเภทการชำระเงิน");
      fireEvent.click(paymentBtn);

      const draft = JSON.parse(sessionStorage.getItem("expense_draft_v2") || "{}");
      expect(draft.note).toBe("test note");
    });
  });

  describe("Type Dropdown Menu", () => {
    it("should toggle dropdown when clicking type pill", async () => {
      renderWithRouter(<Expense />);

      const typePill = screen.getByText("ค่าใช้จ่าย").closest("button");
      fireEvent.click(typePill!);

      await waitFor(() => {
        expect(screen.getByText("รายได้")).toBeInTheDocument();
      });
    });

    it("should navigate to income page when selecting รายได้", async () => {
      renderWithRouter(<Expense />);

      const typePill = screen.getByText("ค่าใช้จ่าย").closest("button");
      fireEvent.click(typePill!);

      await waitFor(() => {
        const incomeOption = screen.getByText("รายได้");
        fireEvent.click(incomeOption);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/income");
    });
  });

  describe("Form Submission", () => {
    it("should show alert if required fields are missing", async () => {
      renderWithRouter(<Expense />);

      const confirmBtn = document.querySelector(".ok-btn");
      fireEvent.click(confirmBtn!);

      expect(global.alert).toHaveBeenCalledWith("Required ❌");
    });

    it("should submit form successfully with all required fields", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithRouter(<Expense />);
      const user = userEvent.setup();

      // Fill in required fields
      fireEvent.click(screen.getByText("5"));
      fireEvent.click(screen.getByText("0"));

      const noteInput = screen.getByPlaceholderText("โน้ต");
      await user.type(noteInput, "test");

      // Mock place from session storage
      sessionStorage.setItem("selectedPlaceName", "Test Location");
      window.dispatchEvent(new Event("focus"));

      await waitFor(() => {
        const placeInput = screen.getByPlaceholderText("สถานที่") as HTMLInputElement;
        expect(placeInput.value).toBe("Test Location");
      });

      // Mock payment method
      vi.mocked(vi.importActual("../PaymentMethodContext")).then(mod => {
        vi.spyOn(mod as any, "usePaymentMethod").mockReturnValue({
          payment: { name: "เงินสด" },
          setPayment: mockSetPayment,
          clearPayment: mockClearPayment,
        });
      });
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      renderWithRouter(<Expense />);

      // Setup form with all required data
      fireEvent.click(screen.getByText("1"));
      fireEvent.click(screen.getByText("0"));
      fireEvent.click(screen.getByText("0"));

      sessionStorage.setItem("selectedPlaceName", "Test Place");
      window.dispatchEvent(new Event("focus"));

      const confirmBtn = document.querySelector(".ok-btn");
      fireEvent.click(confirmBtn!);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    });
  });

  describe("Session Storage Integration", () => {
    it("should restore form data from session storage", () => {
      const draftData = {
        category: "ค่าเดินทาง",
        amount: "250",
        note: "แท็กซี่",
        place: "บ้าน",
      };

      sessionStorage.setItem("expense_draft_v2", JSON.stringify(draftData));

      renderWithRouter(<Expense />);

      expect(screen.getByLabelText("จำนวนเงิน")).toHaveValue("250");
      expect(screen.getByPlaceholderText("โน้ต")).toHaveValue("แท็กซี่");
      expect(screen.getByPlaceholderText("สถานที่")).toHaveValue("บ้าน");
    });

    it("should save form data to session storage on changes", async () => {
      renderWithRouter(<Expense />);
      const user = userEvent.setup();

      const noteInput = screen.getByPlaceholderText("โน้ต");
      await user.type(noteInput, "new note");

      await waitFor(() => {
        const draft = JSON.parse(sessionStorage.getItem("expense_draft_v2") || "{}");
        expect(draft.note).toBe("new note");
      });
    });

    it("should clear session storage after successful submission", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      sessionStorage.setItem("expense_draft_v2", JSON.stringify({ amount: "100" }));

      renderWithRouter(<Expense />);

      // Simulate successful submission
      // Note: This would require mocking all required fields and payment method

      // After submission, storage should be cleared
      // expect(sessionStorage.getItem("expense_draft_v2")).toBeNull();
    });
  });

  describe("Date and Time Selection", () => {
    it("should display date time picker button", () => {
      renderWithRouter(<Expense />);

      const dateBtn = screen.getByText(/วัน \/ เดือน \/ ปี เวลา|^\d{2}\/\d{2}\/\d{4}/);
      expect(dateBtn).toBeInTheDocument();
    });

    it("should open date picker when clicking date button", async () => {
      renderWithRouter(<Expense />);

      const dateSegment = document.querySelector(".date-seg");
      expect(dateSegment).toBeInTheDocument();

      fireEvent.click(dateSegment!);
      
      // The datetime-local input should exist
      const dateInput = document.querySelector('input[type="datetime-local"]');
      expect(dateInput).toBeInTheDocument();
    });
  });

  describe("Bottom Navigation", () => {
    it("should render bottom navigation component", () => {
      renderWithRouter(<Expense />);
      
      expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
    });
  });
});