// src/pages/customoutcome.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CategoryCustom from "./customoutcome";
import { TempCategoryProvider } from "../TempCategoryContext";

// mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock alert
beforeEach(() => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  mockNavigate.mockReset();
});

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <TempCategoryProvider>{ui}</TempCategoryProvider>
    </MemoryRouter>
  );
}

describe("CustomOutcome Page", () => {
  it("แสดงหัวข้อ OutcomeCustom", () => {
    renderWithProvider(<CategoryCustom />);
    expect(screen.getByText("OutcomeCustom")).toBeInTheDocument();
  });

  it("สามารถค้นหาและเลือกไอคอนได้", () => {
    renderWithProvider(<CategoryCustom />);
    fireEvent.change(
      screen.getByPlaceholderText(/ค้นหาไอคอน/i),
      { target: { value: "กาแฟ" } }
    );
    const coffeeBtn = screen.getByTitle("กาแฟ");
    fireEvent.click(coffeeBtn);
    expect(coffeeBtn).toHaveClass("active");
  });

  it("แสดง alert ถ้าไม่เลือกไอคอนหรือไม่กรอกชื่อ", () => {
    renderWithProvider(<CategoryCustom />);
    const confirmBtn = screen.getByRole("button", { name: "ยืนยัน" });
    fireEvent.click(confirmBtn);
    expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
  });

  it("บันทึกและ navigate กลับ เมื่อเลือกครบถ้วน", () => {
    renderWithProvider(<CategoryCustom />);
    fireEvent.change(
      screen.getByPlaceholderText(/ค้นหาไอคอน/i),
      { target: { value: "งาน" } }
    );
    fireEvent.click(screen.getByTitle("งาน"));

    fireEvent.change(
      screen.getByPlaceholderText("ชื่อหมวดหมู่"),
      { target: { value: "งานอดิเรก" } }
    );

    fireEvent.click(screen.getByRole("button", { name: "ยืนยัน" }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});