// src/pages/day.test.tsx
import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Day from "./day";

// ---------- Helpers ----------
function mockFetchOk(data: any, delay = 0) {
  const resp = {
    ok: true,
    json: async () => data,
  } as Response;
  if (delay > 0) {
    return vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(() => r(resp), delay))
    );
  }
  return vi.fn().mockResolvedValue(resp);
}

function mockFetchErr(status = 500) {
  const resp = {
    ok: false,
    status,
    json: async () => {
      throw new Error(`โหลดรายการไม่สำเร็จ (${status})`);
    },
  } as any;
  return vi.fn().mockResolvedValue(resp);
}

function renderWithRouter(
  ui: React.ReactNode,
  initialEntries = ["/day?date=2025-09-24"]
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
}

beforeEach(() => {
  // polyfill ResizeObserver
  // @ts-ignore
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("Day Page", () => {
  it("แสดงสถานะ loading ตอนแรก", async () => {
    global.fetch = mockFetchOk([], 80) as any;

    renderWithRouter(<Day />);

    expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/กำลังโหลดข้อมูล/i)).not.toBeInTheDocument()
    );
  });

  it("แสดงข้อความ error เมื่อ API ล้มเหลว", async () => {
    global.fetch = mockFetchErr(500) as any;

    renderWithRouter(<Day />);

    await waitFor(() =>
      expect(
        screen.getByText(/โหลดรายการไม่สำเร็จ \(500\)/)
      ).toBeInTheDocument()
    );
  });

  it("แสดงข้อความ 'วันนี้ยังไม่มีรายการ' ถ้า API คืน array ว่าง", async () => {
    global.fetch = mockFetchOk([]) as any;

    renderWithRouter(<Day />);

    await waitFor(() =>
      expect(screen.getByText(/วันนี้ยังไม่มีรายการ/i)).toBeInTheDocument()
    );
  });

  it("แสดงข้อมูลเมื่อโหลดสำเร็จ", async () => {
    const data = [
      { category: "อาหาร", type: "EXPENSE", amount: 120 },
      { category: "เดินทาง", type: "EXPENSE", amount: 80 },
    ];
    global.fetch = mockFetchOk(data) as any;

    renderWithRouter(<Day />);

    await waitFor(() => expect(screen.getByText("ประเภท")).toBeInTheDocument());

    expect(screen.getByText("อาหาร")).toBeInTheDocument();
    expect(screen.getByText("เดินทาง")).toBeInTheDocument();

    // ตรวจเลขซ้ำ ใช้ getAllByText
    expect(screen.getAllByText(/120/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/80/).length).toBeGreaterThan(0);
  });

  it("เปลี่ยนวันเมื่อกดปุ่ม ก่อนหน้า/ถัดไป", async () => {
    // สร้าง resp ปลอมให้เรียกได้หลายครั้ง (initial, next, prev)
    const makeResp = (data: any) =>
      ({
        ok: true,
        json: async () => data,
      } as Response);

    // ใช้ vi.fn แล้ว chain resolved value แต่ละครั้ง
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeResp([])) // initial load
      .mockResolvedValueOnce(makeResp([])) // after click next
      .mockResolvedValueOnce(makeResp([])); // after click prev

    renderWithRouter(<Day />, ["/day?date=2025-09-24"]);

    // หา container ของสวิตเชอร์
    const switcher = (await screen.findByRole("button", { name: "ถัดไป" })).closest(
      ".switcher"
    ) as HTMLElement;

    // helper: อ่านวันที่จาก chip
    const readDateText = () => {
      const chip = Array.from(switcher.querySelectorAll("*")).find((n) =>
        /\d{2}\/\d{2}\/\d{4}/.test(n.textContent ?? "")
      ) as HTMLElement | undefined;
      return chip?.textContent?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? "";
    };

    // helper: format AD -> TH
    const fmtTh = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear() + 543;
      return `${dd}/${mm}/${yyyy}`;
    };

    // รอให้ initial render เสร็จแล้วอ่านวันที่ตั้งต้น
    await waitFor(() => expect(readDateText()).toMatch(/\d{2}\/\d{2}\/\d{4}/));
    const startStr = readDateText();
    const [dd, mm, th] = startStr.split("/").map(Number);
    const start = new Date(th - 543, mm - 1, dd);

    // ➡️ ถัดไป
    const nextBtn = within(switcher).getByRole("button", { name: "ถัดไป" });
    nextBtn.click();

    const next = new Date(start);
    next.setDate(next.getDate() + 1);
    await waitFor(() => {
      // ใช้ includes เพื่อลดความเปราะบางของ space/newline
      expect(readDateText()).toContain(fmtTh(next));
    });

    // ⬅️ ก่อนหน้า (กลับมาวันเดิม)
    const prevBtn = within(switcher).getByRole("button", { name: "ก่อนหน้า" });
    prevBtn.click();

    await waitFor(() => {
      expect(readDateText()).toContain(fmtTh(start));
    });

    // ตรวจว่ามีการเรียก fetch ตามจำนวนครั้งที่คาด
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});