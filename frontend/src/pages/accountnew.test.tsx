// src/pages/dw
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AccountNew from "./accountnew";

// ---- Mocks ----
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();

// mock react-router-dom hooks
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
}));

// mock BottomNav ให้เบา ๆ
vi.mock("./buttomnav", () => ({
    __esModule: true,
    default: () => <div data-testid="bottom-nav" />,
}));

// ---- Helpers ----
const makeUser = () => userEvent.setup();

function mockFetchOk() {
    (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
        json: vi.fn().mockResolvedValue({}),
    });
}

function mockFetchFail(msg = "Bad Request", status = 400) {
    (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: false,
        status,
        text: vi.fn().mockResolvedValue(msg),
    });
}

function mockFetchReject(err = new Error("network")) {
    (global.fetch as any) = vi.fn().mockRejectedValue(err);
}

/** เลือกประเภทโดยหา “ปุ่มเปิดเมนูประเภท” จริง ๆ (button[aria-haspopup=listbox]) ภายในแถวที่มีข้อความ “ประเภทบัญชี” */
const selectType = async (typeName: string, u = makeUser()) => {
    const row =
        screen.getByText("ประเภทบัญชี").closest(".row") ||
        screen.getByText("ประเภทบัญชี").parentElement;
    if (!row) throw new Error("ไม่พบแถว 'ประเภทบัญชี'");
    const opener = row.querySelector<HTMLButtonElement>("button[aria-haspopup='listbox']");
    if (!opener) throw new Error("ไม่พบปุ่มเปิดเมนูประเภท");
    await u.click(opener);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    await u.click(screen.getByRole("option", { name: typeName }));
};

describe("AccountNew (API version)", () => {
    let alertSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // ค่าเริ่มต้นเป็นหน้า Create
        mockUseLocation.mockReturnValue({
            state: undefined,
            pathname: "/accounts/new",
            search: "",
            hash: "",
            key: "k",
        });

        // mock fetch & alert & rAF
        (global.fetch as any) = vi.fn();
        alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            cb(Date.now());
            return 0;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("แสดงหน้า Create ได้ถูกต้อง และ format จำนวนเงินด้วย comma", () => {
        render(<AccountNew />);
        expect(screen.getByRole("heading", { name: "สร้างบัญชี" })).toBeInTheDocument();

        const amount = screen.getByLabelText("จำนวนเงิน");
        fireEvent.change(amount, { target: { value: "12,3a45x" } });
        // rAF ถูก mock ให้ sync แล้ว
        expect(amount).toHaveValue("12,345");
    });

    it("แจ้งเตือนเมื่อข้อมูลไม่ครบ แล้วไม่เรียก fetch", async () => {
        const u = makeUser();
        render(<AccountNew />);
        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));
        expect(alertSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("Create Mode: กรอกครบ → เรียก POST /api/accounts และ navigate('/home')", async () => {
        const u = makeUser();
        mockFetchOk();

        render(<AccountNew />);

        // กรอกชื่อ
        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีออมทรัพย์");

        // เลือกประเภท
        await selectType("ธนาคาร", u);

        // เลือกไอคอน 'กระปุก'
        await u.click(screen.getByRole("button", { name: "กระปุก" }));

        // ใส่จำนวนเงิน 5000 (จะถูกฟอร์แมตเป็น 5,000)
        const amount = screen.getByLabelText("จำนวนเงิน");
        fireEvent.change(amount, { target: { value: "5000" } });
        await waitFor(() => expect(amount).toHaveValue("5,000"));

        // submit
        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        // ตรวจเรียก fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const [url, opts] = (global.fetch as any).mock.calls[0];
            expect(url).toBe("http://localhost:8081/api/accounts");
            expect(opts.method).toBe("POST");
            expect(opts.credentials).toBe("include");
            expect(opts.headers["Content-Type"]).toBe("application/json");
            const parsed = JSON.parse(opts.body);
            expect(parsed).toEqual({
                name: "บัญชีออมทรัพย์",
                type: "ธนาคาร",
                amount: 5000,
                iconKey: "piggy",
            });
        });

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    });

    it("Edit Mode: preload ข้อมูลจาก state และส่ง PUT /api/accounts/{id}", async () => {
        const u = makeUser();
        mockFetchOk();

        mockUseLocation.mockReturnValue({
            state: {
                mode: "edit",
                account: { id: 99, name: "บัญชีเดิม", amount: 1000, iconKey: "wallet", type: "เงินสด" },
            },
            pathname: "/accounts/edit",
            search: "",
            hash: "",
            key: "k",
        });

        render(<AccountNew />);

        // preload ค่าต้องขึ้น
        expect(screen.getByRole("heading", { name: "แก้ไขบัญชี" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("ชื่อบัญชี")).toHaveValue("บัญชีเดิม");
        expect(screen.getByLabelText("จำนวนเงิน")).toHaveValue("1,000");

        // แก้ชื่อ & จำนวนเงิน & ไอคอน
        await u.clear(screen.getByPlaceholderText("ชื่อบัญชี"));
        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีที่แก้แล้ว");
        fireEvent.change(screen.getByLabelText("จำนวนเงิน"), { target: { value: "888" } });
        await u.click(screen.getByRole("button", { name: "กระเป๋าเงิน" })); // เปลี่ยนไอคอนเป็น wallet

        await u.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const [url, opts] = (global.fetch as any).mock.calls[0];
            expect(url).toBe("http://localhost:8081/api/accounts/99");
            expect(opts.method).toBe("PUT");
            const parsed = JSON.parse(opts.body);
            expect(parsed).toEqual({
                name: "บัญชีที่แก้แล้ว",
                type: "เงินสด",
                amount: 888,
                iconKey: "wallet",
            });
        });

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    });

    it("PUT โหมดแก้ไข: ถ้าไม่มี id ใน state → alert และไม่เรียก fetch", async () => {
        const u = makeUser();

        mockUseLocation.mockReturnValue({
            state: {
                mode: "edit",
                account: { /* ไม่มี id */ name: "A", amount: 1000, iconKey: "wallet", type: "เงินสด" },
            },
            pathname: "/accounts/edit",
            search: "",
            hash: "",
            key: "k",
        });

        render(<AccountNew />);

        await u.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
        expect(alertSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("เมื่อ Backend ตอบ !ok → แสดงข้อความ error จาก response.text() และไม่ navigate", async () => {
        const u = makeUser();
        mockFetchFail("ชื่อบัญชีซ้ำ", 400);

        render(<AccountNew />);

        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีซ้ำ");
        await selectType("เงินสด", u);
        await u.click(screen.getByRole("button", { name: "กระปุก" }));
        fireEvent.change(screen.getByLabelText("จำนวนเงิน"), { target: { value: "10" } });

        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("บันทึกไม่สำเร็จ: "));
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("เมื่อ fetch โยน exception (network error) → alert 'เชื่อมต่อเซิร์ฟเวอร์' และไม่ navigate", async () => {
        const u = makeUser();
        mockFetchReject(new Error("ECONNREFUSED"));

        render(<AccountNew />);

        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "N");
        await selectType("เงินสด", u);
        await u.click(screen.getByRole("button", { name: "กระปุก" }));
        fireEvent.change(screen.getByLabelText("จำนวนเงิน"), { target: { value: "10" } });

        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
