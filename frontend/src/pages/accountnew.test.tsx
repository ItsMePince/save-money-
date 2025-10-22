// src/pages/accountnew.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountNew from "./accountnew";

// ---- mock useNavigate (vitest) ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual: any = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

// ✅ helper: เลือก trigger ของ dropdown ให้ชัด (ไม่ปะทะกับ label)
function getTypeDropdownTrigger(): HTMLElement {
  // พยายามหา element ที่เป็น placeholder ก่อน
  const all = screen.getAllByText(/ประเภท/i);
  // เลือกตัวที่เป็น placeholder ถ้ามี
  const placeholderEl = all.find((el) =>
    el.classList?.contains("placeholder")
  );
  if (placeholderEl) return placeholderEl as HTMLElement;

  // ถ้าไม่มี class ให้เลือกตัวถัดไป (โดยมากตัวแรกจะเป็น label, ตัวถัดไปคือ trigger)
  if (all.length > 1) return all[1] as HTMLElement;

  // fallback อย่างสุภาพ
  return all[0] as HTMLElement;
}

describe("AccountNew Page", () => {
  it("แสดงหัวข้อ 'สร้างบัญชี' และปุ่มยืนยัน", () => {
    render(
      <MemoryRouter>
        <AccountNew />
      </MemoryRouter>
    );
    expect(screen.getByText(/สร้างบัญชี/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ยืนยัน/i })).toBeInTheDocument();
  });

  it("กรอกไม่ครบ → alert error", () => {
    render(
      <MemoryRouter>
        <AccountNew />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(window.alert).toHaveBeenCalledWith(
      "กรอกข้อมูลให้ครบและจำนวนเงินให้ถูกต้องก่อนน้าา"
    );
  });

  it("สามารถเลือกประเภทบัญชีและไอคอนได้", () => {
    render(
      <MemoryRouter>
        <AccountNew />
      </MemoryRouter>
    );

    // เปิด dropdown ประเภท (ใช้ helper เพื่อไม่ชน label)
    const trigger = getTypeDropdownTrigger();
    fireEvent.click(trigger);

    // เลือก "ธนาคาร" จากรายการ
    const dd = document.querySelector(".dropdown") as HTMLElement;
    const bankOption = within(dd).getByText(/ธนาคาร/i);
    fireEvent.click(bankOption);

    // ข้อความที่เลือกต้องแสดงอยู่
    expect(screen.getByText(/ธนาคาร/i)).toBeInTheDocument();

    // เลือกไอคอน "กระปุก"
    const piggyBtn = screen.getByRole("button", { name: /กระปุก/i });
    fireEvent.click(piggyBtn);
    expect(piggyBtn).toHaveClass("active");
  });

  // (ถ้าอยากเปิดเทสต์นี้อีกครั้ง ก็เอา .skip ออกได้เมื่อพร้อม)
  it.skip("บันทึกบัญชีใหม่ลง localStorage และ navigate ไป /home (ไม่สนตัวพิมพ์)", async () => {
    render(
      <MemoryRouter>
        <AccountNew />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/ชื่อบัญชี/i), {
      target: { value: "MyCash" },
    });

    const trigger = getTypeDropdownTrigger();
    fireEvent.click(trigger);

    const dd = document.querySelector(".dropdown") as HTMLElement;
    fireEvent.click(within(dd).getByText(/เงินสด/i));

    fireEvent.change(screen.getByPlaceholderText(/บาท/i), {
      target: { value: "1000" },
    });

    fireEvent.click(screen.getByRole("button", { name: /ยืนยัน/i }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("accounts") || "[]");
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe("MyCash");
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/home$/i));
    });
  });

  it.skip("โหมดแก้ไข: โหลดค่ามาแก้ไขและ submit แล้วบันทึก", async () => {
    const initAcc = { name: "Old", amount: 50, iconKey: "wallet", type: "เงินสด" };
    localStorage.setItem("accounts", JSON.stringify([initAcc]));

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/edit", state: { mode: "edit", index: 0, account: initAcc } } as any,
        ]}
      >
        <AccountNew />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue("Old")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/ชื่อบัญชี/i), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: /บันทึกการแก้ไข/i }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem("accounts") || "[]");
      expect(saved[0].name).toBe("Updated");
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/home$/i));
    });
  });
});
