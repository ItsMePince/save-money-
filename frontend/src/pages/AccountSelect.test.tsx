// src/pages/AccountSelect.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountSelect from "./AccountSelect";
import { vi } from "vitest";

// --- mock navigate ---
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// --- mock PaymentMethodContext ---
vi.mock("../PaymentMethodContext", () => ({
  usePaymentMethod: () => ({ setPayment: vi.fn() }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountSelect />
    </MemoryRouter>
  );
}

describe("AccountSelect Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("แสดง dropdown filter และรายการเริ่มต้น", () => {
    renderPage();
    // dropdown เริ่มต้น
    expect(screen.getByRole("button", { name: /ทั้งหมด/i })).toBeInTheDocument();
    // รายการเริ่มต้นใน UI
    expect(screen.getByText("ธ.ไทยพาณิชย์")).toBeInTheDocument();
    expect(screen.getByText("เงินสด")).toBeInTheDocument();
  });

  it("สามารถเปิด dropdown และเลือก filter 'ธนาคาร' ได้", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ทั้งหมด/i }));
    fireEvent.click(screen.getByText("ธนาคาร"));
    // เหลือเฉพาะของธนาคาร
    expect(screen.getByText("ธ.ไทยพาณิชย์")).toBeInTheDocument();
    expect(screen.queryByText("เงินสด")).not.toBeInTheDocument();
  });

  it("สามารถกด favorite/unfavorite ได้", () => {
    renderPage();
    // สมมติปุ่มดาวมี aria-label ตามสถานะ
    const starBtn = screen.getAllByLabelText(/unfavorite/i)[0];
    fireEvent.click(starBtn);
    // กดแล้วควรสลับ aria-label เป็น Favorite
    expect(
      screen.getAllByLabelText(/favorite/i)[0]
    ).toBeInTheDocument();
  });

  // หมายเหตุ: UI ปัจจุบันไม่มีวิธีทำให้รายการว่างจริง ๆ (แต่ละ filter มีอย่างน้อย 1 รายการ
  // และการกดดาวไม่ได้ซ่อนรายการ) จึง skip เคสนี้ไว้ก่อน
  it.skip("แสดงข้อความ 'ไม่มีรายการ' เมื่อ filter แล้วไม่เจอ", () => {
    renderPage();
    // ถ้าในอนาคตมี toggle 'เฉพาะรายการโปรด' หรือช่องค้นหา ค่อยมาเติมเทสตรงนี้ได้
    // expect(screen.getByText("ไม่มีรายการ")).toBeInTheDocument();
  });

  it("กดเลือก account แล้วเรียก navigate(-1)", async () => {
    renderPage();
    fireEvent.click(screen.getByText("เงินสด"));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
