// src/pages/Home.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";

// helper: mock fetch response
function mockFetchOnce(data: any, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => data,
  }) as any;
}

describe("Home Page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("แสดงยอดเงินรวม", async () => {
    mockFetchOnce([]); // ไม่มี transaction
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText(/เงินรวม/)).toBeInTheDocument();
  });

  it("แสดง state กำลังโหลด", async () => {
    mockFetchOnce([]); // แต่เราจะตรวจ loading ก่อน
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByText(/กำลังโหลดข้อมูล/)).toBeInTheDocument();
  });

  it("แสดง error เมื่อ API ล้มเหลว", async () => {
    mockFetchOnce({}, false, 500);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText(/โหลดข้อมูลไม่สำเร็จ/)).toBeInTheDocument();
  });

  it("แสดงข้อความเมื่อไม่มีข้อมูล", async () => {
    mockFetchOnce([]); // ไม่มี transaction
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(
      await screen.findByText(/ยังไม่มีรายการในเดือนนี้/)
    ).toBeInTheDocument();
  });

  it("แสดง transaction ล่าสุดเมื่อมีข้อมูล", async () => {
    const fakeTx = [
      {
        id: 1,
        type: "INCOME",
        category: "เงินเดือน",
        amount: 5000,
        date: "2025-09-01",
        note: "test",
        iconKey: "Wallet",
      },
    ];
    mockFetchOnce(fakeTx);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(await screen.findByText(/test/)).toBeInTheDocument();
    expect(screen.getByText(/\+5,000/)).toBeInTheDocument();
  });

  it("เปลี่ยนเดือนด้วยปุ่ม prev/next", async () => {
    mockFetchOnce([]);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const prev = screen.getByLabelText("Previous month");
    const next = screen.getByLabelText("Next month");
    fireEvent.click(prev);
    fireEvent.click(next);
    expect(prev).toBeInTheDocument();
    expect(next).toBeInTheDocument();
  });

  it("กด More → Delete account เรียก confirm", async () => {
    // เตรียม localStorage
    localStorage.setItem(
      "accounts",
      JSON.stringify([{ name: "TestBank", amount: 1000, iconKey: "bank" }])
    );
    mockFetchOnce([]); // ไม่มี tx
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // เปิดเมนู more
    fireEvent.click(await screen.findByLabelText("More actions"));
    fireEvent.click(screen.getByText("ลบ"));
    expect(window.confirm).toHaveBeenCalled();
  });
});