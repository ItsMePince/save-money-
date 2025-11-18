import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AccountNew from "./accountnew";

// ⭐ FIX: Mock API_BASE ให้ตรงกับ URL ที่โปรเจคใช้จริง
vi.mock("../lib/api", () => ({
    API_BASE: "http://localhost:8081/api"
}));

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

/** เลือกประเภทโดยหา “ปุ่มเปิดเมนูประเภท” จริง ๆ */
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

// ---------------------- TEST SUITE ------------------------

describe("AccountNew (API version)", () => {
    let alertSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Default = Create Mode
        mockUseLocation.mockReturnValue({
            state: undefined,
            pathname: "/accounts/new",
            search: "",
            hash: "",
            key: "k",
        });

        (global.fetch as any) = vi.fn();
        alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
            cb(Date.now());
            return 0;
        });
    });

    afterEach(() => vi.restoreAllMocks());

    // ----------- TEST CASES --------------

    it("แสดงหน้า Create ได้ถูกต้อง และ format จำนวนเงิน", () => {
        render(<AccountNew />);
        expect(screen.getByRole("heading", { name: "สร้างบัญชี" })).toBeInTheDocument();

        const amount = screen.getByLabelText("จำนวนเงิน");
        fireEvent.change(amount, { target: { value: "12,3a45x" } });

        expect(amount).toHaveValue("12,345");
    });

    it("ข้อมูลไม่ครบ → แสดง alert และไม่ fetch", async () => {
        const u = makeUser();
        render(<AccountNew />);

        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        expect(alertSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("Create Mode: submit → POST /api/accounts + navigate('/home')", async () => {
        const u = makeUser();
        mockFetchOk();

        render(<AccountNew />);

        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีออมทรัพย์");
        await selectType("ธนาคาร", u);
        await u.click(screen.getByRole("button", { name: "กระปุก" }));

        const amount = screen.getByLabelText("จำนวนเงิน");
        fireEvent.change(amount, { target: { value: "5000" } });
        await waitFor(() => expect(amount).toHaveValue("5,000"));

        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        await waitFor(() => {
            const [url, opts] = (global.fetch as any).mock.calls[0];
            expect(url).toBe("http://localhost:8081/api/accounts");
            expect(opts.method).toBe("POST");

            const parsed = JSON.parse(opts.body);
            expect(parsed).toEqual({
                name: "บัญชีออมทรัพย์",
                type: "ธนาคาร",
                amount: 5000,
                iconKey: "piggy",
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/home");
    });

    it("Edit Mode: preload + PUT /api/accounts/99", async () => {
        const u = makeUser();
        mockFetchOk();

        mockUseLocation.mockReturnValue({
            state: {
                mode: "edit",
                account: { id: 99, name: "บัญชีเดิม", amount: 1000, iconKey: "wallet", type: "เงินสด" },
            },
        });

        render(<AccountNew />);

        expect(screen.getByRole("heading", { name: "แก้ไขบัญชี" })).toBeInTheDocument();
        expect(screen.getByPlaceholderText("ชื่อบัญชี")).toHaveValue("บัญชีเดิม");
        expect(screen.getByLabelText("จำนวนเงิน")).toHaveValue("1,000");

        await u.clear(screen.getByPlaceholderText("ชื่อบัญชี"));
        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีที่แก้แล้ว");

        fireEvent.change(screen.getByLabelText("จำนวนเงิน"), { target: { value: "888" } });
        await u.click(screen.getByRole("button", { name: "กระเป๋าเงิน" }));

        await u.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

        await waitFor(() => {
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

        expect(mockNavigate).toHaveBeenCalledWith("/home");
    });

    it("Edit Mode: ถ้าไม่มี id → alert + ไม่ fetch", async () => {
        const u = makeUser();

        mockUseLocation.mockReturnValue({
            state: {
                mode: "edit",
                account: { name: "A", amount: 1000, iconKey: "wallet", type: "เงินสด" },
            },
        });

        render(<AccountNew />);

        await u.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

        expect(alertSpy).toHaveBeenCalled();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("Backend !ok → alert ข้อความ error และไม่ navigate", async () => {
        const u = makeUser();
        mockFetchFail("ชื่อบัญชีซ้ำ");

        render(<AccountNew />);

        await u.type(screen.getByPlaceholderText("ชื่อบัญชี"), "บัญชีซ้ำ");
        await selectType("เงินสด", u);
        await u.click(screen.getByRole("button", { name: "กระปุก" }));
        fireEvent.change(screen.getByLabelText("จำนวนเงิน"), { target: { value: "10" } });

        await u.click(screen.getByRole("button", { name: "ยืนยัน" }));

        await waitFor(() =>
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("บันทึกไม่สำเร็จ:"))
        );

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("fetch error → alert 'เชื่อมต่อเซิร์ฟเวอร์' และไม่ navigate", async () => {
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
