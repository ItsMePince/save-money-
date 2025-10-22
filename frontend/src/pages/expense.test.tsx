// src/pages/expense.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Expense from "./expense";
import { TempCategoryProvider } from "../TempCategoryContext";

// ✅ mock BottomNav กัน useLocation error
vi.mock("./buttomnav", () => ({
  default: () => <div data-testid="bottom-nav" />,
}));

// ✅ mock usePaymentMethod เพื่อไม่ต้องใช้ Provider จริง
vi.mock("../PaymentMethodContext", () => ({
  usePaymentMethod: () => ({
    payment: { name: "เงินสด" },
    setPayment: vi.fn(),
  }),
}));

// helper: เลือกปุ่มยืนยันด้วย class
function getConfirmBtn() {
  const btn = document.querySelector<HTMLButtonElement>(".ok-btn");
  if (!btn) throw new Error("ไม่พบปุ่มยืนยัน (.ok-btn)");
  return btn;
}

// helper: เลือกปุ่มลบใน keypad ด้วย class
function getBackspaceBtn() {
  const btn = document.querySelector<HTMLButtonElement>(".keypad .key.danger");
  if (!btn) throw new Error("ไม่พบปุ่มลบ (.keypad .key.danger)");
  return btn;
}

// helper: render พร้อม TempCategoryProvider
function renderWithProviders(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <TempCategoryProvider>{ui}</TempCategoryProvider>
    </MemoryRouter>
  );
}

// mock fetch ทีละครั้ง
function mockFetchOnce(data: any, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
    text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
  }) as any;
}

describe("Expense Page", () => {
  const originalAlert = window.alert;
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    sessionStorage.clear();
  });
  afterEach(() => {
    window.alert = originalAlert;
  });

  it("แสดงหัวข้อ 'ค่าใช้จ่าย' และปุ่ม confirm", () => {
    renderWithProviders(<Expense />);
    expect(screen.getByText("ค่าใช้จ่าย")).toBeInTheDocument();
    expect(getConfirmBtn()).toBeInTheDocument();
  });

  it("สามารถเลือกหมวดหมู่ได้", () => {
    renderWithProviders(<Expense />);
    const giftBtn = screen.getByText("ของขวัญ");
    fireEvent.click(giftBtn);
    // โครงสร้างปุ่มเป็น <button class="cat ..."><span>ของขวัญ</span></button>
    // จึงเช็ค class ที่ element ของ span (parent คือ button)
    expect(giftBtn.parentElement).toHaveClass("cat");
    expect(giftBtn.parentElement?.className).toMatch(/active/);
  });

  it("keypad: พิมพ์ตัวเลขและลบได้", () => {
    renderWithProviders(<Expense />);

    const keypad = document.querySelector(".keypad") as HTMLElement;
    const amountEl = document.querySelector(".amount .num") as HTMLElement;

    // จำกัดการค้นหาใน keypad เพื่อไม่ชนกับตัวเลขแสดงผล
    fireEvent.click(within(keypad).getByText("1"));
    fireEvent.click(within(keypad).getByText("2"));

    expect(amountEl).toHaveTextContent("12");

    // ลบ 1 ตัว
    fireEvent.click(getBackspaceBtn());
    expect(amountEl).toHaveTextContent("1");
  });

  it("แสดง alert ถ้า required field ไม่ครบ", async () => {
    renderWithProviders(<Expense />);
    fireEvent.click(getConfirmBtn());
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Required ❌");
    });
  });

  it("เรียก API และ reset เมื่อข้อมูลครบถ้วน", async () => {
    mockFetchOnce({}, true);

    renderWithProviders(<Expense />);

    // กรอกฟิลด์ที่จำเป็น
    fireEvent.change(screen.getByPlaceholderText("โน้ต"), {
      target: { value: "test note" },
    });
    fireEvent.change(screen.getByPlaceholderText("สถานที่"), {
      target: { value: "office" },
    });

    const keypad = document.querySelector(".keypad") as HTMLElement;
    fireEvent.click(within(keypad).getByText("1"));
    fireEvent.click(within(keypad).getByText("0"));

    fireEvent.click(getConfirmBtn());

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("บันทึกเรียบร้อย ✅");
    });
  });
});