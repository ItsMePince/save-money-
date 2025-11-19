// src/pages/Day.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Day from "./day";

// ---------- mock recharts (ให้ jsdom render ได้) ----------
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="piechart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: ({ children }: any) => <div data-testid="cell">{children}</div>,
  Tooltip: () => null,
}));

// ---------- helpers ----------
type ExpenseDTO = {
  id: number;
  type: "EXPENSE" | "INCOME";
  category: string;
  amount: number;
  date: string;
  iconKey?: string | null;
};

type ApiRepeated = {
  id: number;
  name: string;
  account: string;
  amount: number;
  date: string;
  frequency: string;
};

// mock fetch แยก endpoint ตาม URL
function mockFetchDual(opts: {
  expenses?: ExpenseDTO[] | ((url: string) => ExpenseDTO[]);
  repeats?: ApiRepeated[] | ((url: string) => ApiRepeated[]);
  delayMs?: number;
  errorOn?: "expenses" | "repeats";
  errorStatus?: number;
}) {
  const { expenses = [], repeats = [], delayMs = 0, errorOn, errorStatus = 500 } = opts;

  const toResp = (body: unknown, ok = true) =>
    new Response(ok ? JSON.stringify(body) : null, {
      status: ok ? 200 : errorStatus,
      headers: ok ? { "Content-Type": "application/json" } : undefined,
    });

  const resolve = (val: Response) =>
    delayMs > 0 ? new Promise<Response>(r => setTimeout(() => r(val), delayMs)) : Promise.resolve(val);

  global.fetch = vi.fn(async (input: RequestInfo) => {
    const url = String(input);

    if (url.includes("/api/expenses/range")) {
      if (errorOn === "expenses") return resolve(toResp(null as any, false));
      const data = typeof expenses === "function" ? expenses(url) : expenses;
      return resolve(toResp(data, true));
    }

    if (url.includes("/api/repeated-transactions")) {
      if (errorOn === "repeats") return resolve(toResp(null as any, false));
      const data = typeof repeats === "function" ? repeats(url) : repeats;
      return resolve(toResp(data, true));
    }

    return resolve(new Response(null, { status: 404 }));
  }) as any;
}

// ครอบด้วย Router และกำหนดวันเริ่มต้นผ่าน query (คอมโพเนนต์อิงจาก ?date=…)
function renderWithRouter(ui: React.ReactNode, initial = "/day?date=2025-09-24") {
  return render(<MemoryRouter initialEntries={[initial]}>{ui}</MemoryRouter>);
}

// format AD -> พ.ศ.
const fmtTh = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear() + 543;
  return `${dd}/${mm}/${yyyy}`;
};

beforeEach(() => {
  // polyfill ResizeObserver บาง lib ใช้
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

describe("Day page", () => {
  it("แสดงสถานะ loading ตอนแรก", async () => {
    mockFetchDual({ expenses: [], repeats: [], delayMs: 80 });

    renderWithRouter(<Day />);

    expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.queryByText(/กำลังโหลดข้อมูล/i)).not.toBeInTheDocument()
    );
  });

  it("แสดงข้อความ error เมื่อ API expenses ล้มเหลว", async () => {
    mockFetchDual({ errorOn: "expenses", repeats: [] });

    renderWithRouter(<Day />);

    await waitFor(() =>
      expect(
        screen.getByText(/โหลดรายการไม่สำเร็จ|เกิดข้อผิดพลาดในการเชื่อมต่อ/i)
      ).toBeInTheDocument()
    );
  });

  it("แสดง 'วันนี้ยังไม่มีรายการ' เมื่อ expenses/repeats ว่าง", async () => {
    mockFetchDual({ expenses: [], repeats: [] });

    renderWithRouter(<Day />);

    await waitFor(() =>
      expect(screen.getByText(/วันนี้ยังไม่มีรายการ/i)).toBeInTheDocument()
    );
  });

  it("แสดงข้อมูลเมื่อโหลดสำเร็จ (รวมเฉพาะ expenses ที่ส่งมา)", async () => {
    const day = "2025-09-24";
    mockFetchDual({
      expenses: [
        { id: 1, type: "EXPENSE", category: "อาหาร", amount: 120, date: day },
        { id: 2, type: "EXPENSE", category: "เดินทาง", amount: 80, date: day },
      ],
      // repeats ว่าง (หรือจะส่งที่ไม่ตรงวันก็ได้)
      repeats: [],
    });

    renderWithRouter(<Day />, `/day?date=${day}`);

    // รอหัวตาราง
    await waitFor(() => expect(screen.getByText("ประเภท")).toBeInTheDocument());

    expect(screen.getByText("อาหาร")).toBeInTheDocument();
    expect(screen.getByText("เดินทาง")).toBeInTheDocument();

    // จำนวนเงินในคอลัมน์
    expect(screen.getAllByText(/120\s?฿/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/80\s?฿/).length).toBeGreaterThan(0);
  });

  it("เปลี่ยนวันเมื่อกด 'ถัดไป' และ 'ก่อนหน้า' (re-query DOM ทุกครั้ง)", async () => {
    // ตอบว่างทุกครั้ง (ให้โหลดผ่านอย่างเสถียร)
    mockFetchDual({ expenses: [], repeats: [] });

    const user = userEvent.setup();
    renderWithRouter(<Day />, "/day?date=2025-09-24");

    // helper: อ่านวันที่จากทั้งหน้า (query ใหม่ทุกครั้ง)
    const readDateText = () =>
      screen.getByText(/\d{2}\/\d{2}\/\d{4}/).textContent!.match(/\d{2}\/\d{2}\/\d{4}/)![0];

    // รอให้มีวันที่แสดงก่อน
    await waitFor(() => expect(readDateText()).toMatch(/\d{2}\/\d{2}\/\d{4}/));
    const startStr = readDateText();
    const [dd, mm, th] = startStr.split("/").map(Number);
    const start = new Date(th - 543, mm - 1, dd);

    // ➡️ ถัดไป
    await user.click(screen.getByRole("button", { name: "ถัดไป" }));
    const next = new Date(start);
    next.setDate(next.getDate() + 1);

    await waitFor(() => expect(readDateText()).toBe(fmtTh(next)));

    // ⬅️ ก่อนหน้า (กลับวันเดิม)
    await user.click(screen.getByRole("button", { name: "ก่อนหน้า" }));
    await waitFor(() => expect(readDateText()).toBe(fmtTh(start)));
  });
});
