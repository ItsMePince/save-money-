// src/pages/income.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Income from "./income";

// mock BottomNav เพื่อไม่ให้ error เรื่อง useLocation
vi.mock("./buttomnav", () => ({
  default: () => <div data-testid="bottom-nav" />,
}));

// mock usePaymentMethod
vi.mock("../PaymentMethodContext", () => ({
  usePaymentMethod: () => ({
    payment: { name: "เงินสด" },
    setPayment: vi.fn(),
  }),
}));

function getConfirmBtn() {
  const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
  const btn = buttons.find((b) => b.classList.contains("ok-btn"));
  if (!btn) throw new Error("ไม่พบปุ่มยืนยัน (.ok-btn)");
  return btn;
}

function getBackspaceBtn() {
  const btn = document.querySelector<HTMLButtonElement>(".keypad .key.danger");
  if (!btn) throw new Error("ไม่พบปุ่มลบ (.keypad .key.danger)");
  return btn;
}

describe("Income Page", () => {
  const originalAlert = window.alert;
  beforeEach(() => {
    vi.restoreAllMocks();
    window.alert = vi.fn();
    sessionStorage.clear();
  });
  afterEach(() => {
    window.alert = originalAlert;
  });

  it("แสดงหัวข้อ 'รายได้' และปุ่ม confirm", () => {
    render(
      <MemoryRouter>
        <Income />
      </MemoryRouter>
    );
    expect(screen.getByText("รายได้")).toBeInTheDocument();
    expect(getConfirmBtn()).toBeInTheDocument();
  });

  it("สามารถเลือกหมวดหมู่ได้", () => {
    render(
      <MemoryRouter>
        <Income />
      </MemoryRouter>
    );
    const workBtn = screen.getByRole("button", { name: /ทำงาน/ });
    fireEvent.click(workBtn);
    expect(workBtn.className).toMatch(/active/);
  });

  it("keypad: พิมพ์ตัวเลขและลบได้", () => {
    render(
      <MemoryRouter>
        <Income />
      </MemoryRouter>
    );

    const keypad = document.querySelector(".keypad") as HTMLElement;
    const amountEl = document.querySelector(".amount .num") as HTMLElement;

    // จำกัดการค้นหาใน keypad เท่านั้น เพื่อไม่ไปชนตัวเลขที่แสดงผล
    fireEvent.click(within(keypad).getByText("1"));
    fireEvent.click(within(keypad).getByText("2"));

    expect(amountEl).toHaveTextContent("12");

    // ลบตัวเลขด้วยปุ่มไอคอน
    fireEvent.click(getBackspaceBtn());
    expect(amountEl).toHaveTextContent("1");
  });

  it("แสดง alert ถ้า required field ไม่ครบ", async () => {
    render(
      <MemoryRouter>
        <Income />
      </MemoryRouter>
    );

    fireEvent.click(getConfirmBtn());

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Required ❌");
    });
  });

  it("เรียก API และ reset เมื่อข้อมูลครบถ้วน", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "OK",
      } as Response);

    render(
      <MemoryRouter>
        <Income />
      </MemoryRouter>
    );

    // กรอกค่าที่จำเป็น
    fireEvent.change(screen.getByPlaceholderText("โน้ต"), {
      target: { value: "test note" },
    });
    fireEvent.change(screen.getByPlaceholderText("สถานที่"), {
      target: { value: "office" },
    });

    // พิมพ์จำนวนเงิน 10 (ใน keypad)
    const keypad = document.querySelector(".keypad") as HTMLElement;
    fireEvent.click(within(keypad).getByText("1"));
    fireEvent.click(within(keypad).getByText("0"));

    // กด confirm
    fireEvent.click(getConfirmBtn());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("บันทึกเรียบร้อย ✅");
    });
  });
});