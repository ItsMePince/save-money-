// src/pages/customincome.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CustomIncome from "./customincome";

// mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// mock alert
beforeEach(() => {
  vi.spyOn(window, "alert").mockImplementation(() => {});
  mockNavigate.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

function renderWithRouter(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("CustomIncome Page", () => {
  it("แสดงหัวข้อและ input", () => {
    renderWithRouter(<CustomIncome />);
    expect(screen.getByText("Custom Income")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/ค้นหาไอคอนรายได้/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ชื่อหมวดรายได้")).toBeInTheDocument();
  });

  it("กรองด้วย search", () => {
    renderWithRouter(<CustomIncome />);
    const input = screen.getByPlaceholderText(/ค้นหาไอคอนรายได้/i);
    fireEvent.change(input, { target: { value: "เงินเดือน" } });
    expect(screen.getByText("เงินเดือน & งานประจำ")).toBeInTheDocument();
    expect(screen.getByTitle("เงินเดือน")).toBeInTheDocument();
  });

  it("เลือก icon และตั้งชื่อได้", () => {
    renderWithRouter(<CustomIncome />);
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาไอคอนรายได้/i), {
      target: { value: "ฟรีแลนซ์" },
    });
    const chip = screen.getByTitle("ฟรีแลนซ์");
    fireEvent.click(chip);
    fireEvent.change(screen.getByPlaceholderText("ชื่อหมวดรายได้"), {
      target: { value: "รายได้เสริม" },
    });
    expect(screen.getByDisplayValue("รายได้เสริม")).toBeInTheDocument();
  });

  it("alert ถ้าไม่เลือก icon หรือไม่กรอกชื่อ", () => {
    renderWithRouter(<CustomIncome />);
    fireEvent.click(screen.getByRole("button", { name: "ยืนยัน" }));
    expect(window.alert).toHaveBeenCalledWith("กรุณาเลือกไอคอนและตั้งชื่อ");
  });

  it("navigate ไป /income ถ้ากรอกครบ", () => {
    renderWithRouter(<CustomIncome />);
    // เลือก icon
    fireEvent.change(screen.getByPlaceholderText(/ค้นหาไอคอนรายได้/i), {
      target: { value: "เงินเดือน" },
    });
    fireEvent.click(screen.getByTitle("เงินเดือน"));

    // ใส่ชื่อ
    fireEvent.change(screen.getByPlaceholderText("ชื่อหมวดรายได้"), {
      target: { value: "เงินเดือนหลัก" },
    });

    fireEvent.click(screen.getByRole("button", { name: "ยืนยัน" }));

    expect(mockNavigate).toHaveBeenCalledWith("/income", {
      state: {
        customIncome: {
          label: "เงินเดือนหลัก",
          icon: "Briefcase",
        },
      },
      replace: true,
    });
  });
});