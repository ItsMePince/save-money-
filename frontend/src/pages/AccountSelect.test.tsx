// src/pages/AccountSelect.test.tsx
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    type Mock,
} from "vitest";
import AccountSelect from "./AccountSelect";

// ---- Mocks ----
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }));
vi.mock("./buttomnav", () => ({ default: () => <div data-testid="bottom-nav-mock" /> }));

const mockSetPayment = vi.fn();
vi.mock("../PaymentMethodContext", () => ({
    usePaymentMethod: () => ({ setPayment: mockSetPayment }),
}));

// ---- Storage mocks ----
let localStorageStore: Record<string, string> = {};
let sessionStorageStore: Record<string, string> = {};

const mockLocalStorage = {
    getItem: (k: string) => localStorageStore[k] ?? null,
    setItem: (k: string, v: string) => { localStorageStore[k] = String(v); },
    clear: () => { localStorageStore = {}; },
};
const mockSessionStorage = {
    getItem: (k: string) => sessionStorageStore[k] ?? null,
    setItem: (k: string, v: string) => { sessionStorageStore[k] = String(v); },
    clear: () => { sessionStorageStore = {}; },
};

// ---- Seed data (รูปแบบที่ API ส่ง) ----
const mockAccounts = [
    { name: "เงินสด", amount: 1000, type: "เงินสด", iconKey: "wallet", id: 1 },
    { name: "บัญชี กทบ.", amount: 5000, type: "ธนาคาร", iconKey: "bank", id: 2 },
    { name: "บัตร KTC", amount: 99999, type: "บัตรเครดิต", iconKey: "credit", id: 3 },
    { name: "บัญชี ออมสิน", amount: 200, type: "ธนาคาร", iconKey: "piggy", id: 4 },
];

// ---- Helpers ----
const renderComponent = () => render(<AccountSelect />);

// ค้นหา card (button.card.mini) ที่มี .mini__title ตรงกับ label
const findCardByTitle = (container: HTMLElement, label: string) => {
    const cards = Array.from(container.querySelectorAll<HTMLButtonElement>(".card.mini"));
    return cards.find((el) => within(el).queryByText(label));
};

describe("AccountSelect Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageStore = {};
        sessionStorageStore = {};

        vi.stubGlobal("localStorage", mockLocalStorage as unknown as Storage);
        vi.stubGlobal("sessionStorage", mockSessionStorage as unknown as Storage);
        vi.spyOn(window, "alert").mockImplementation(() => {});
        vi.spyOn(window, "scrollTo").mockImplementation(() => {});
        Object.defineProperty(window, "history", {
            value: { length: 2 },
            writable: true,
            configurable: true,
        });

        // ✅ mock fetch (คืน mockAccounts)
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockAccounts,
            })
        );

        localStorage.setItem("accountFavs", JSON.stringify({}));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("ควร render รายการบัญชีทั้งหมดจาก API", async () => {
        const { container } = renderComponent();

        await waitFor(() => {
            expect(findCardByTitle(container, "เงินสด")).toBeTruthy();
            expect(findCardByTitle(container, "บัญชี กทบ.")).toBeTruthy();
            expect(findCardByTitle(container, "บัตร KTC")).toBeTruthy();
            expect(findCardByTitle(container, "บัญชี ออมสิน")).toBeTruthy();
        });
    });

    it("ควรแสดง 'ไม่มีรายการ' ถ้า API คืน []", async () => {
        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const { container } = renderComponent();

        await waitFor(() => {
            expect(container.querySelector(".empty")?.textContent).toContain("ไม่มีรายการ");
        });
    });







    it("ควรสามารถกด 'Favorite' และบันทึกลง localStorage ได้", async () => {
        const user = userEvent.setup();
        const { container } = renderComponent();

        await waitFor(() => expect(findCardByTitle(container, "เงินสด")).toBeTruthy());
        const cashCard = findCardByTitle(container, "เงินสด")!;

        const favBtn = within(cashCard).getByLabelText("Favorite");
        await user.click(favBtn);

        // เปลี่ยนเป็น 'Unfavorite'
        expect(await within(cashCard).findByLabelText("Unfavorite")).toBeInTheDocument();

        // มี entry ใด ๆ ที่ favorite = true ก็พอ (ไม่อิงคีย์ id เดิม)
        const favs = JSON.parse(localStorage.getItem("accountFavs") || "{}");
        const anyFavTrue = Object.values(favs).some((v: any) => v?.favorite === true);
        expect(anyFavTrue).toBe(true);

        // toggle back
        await user.click(within(cashCard).getByLabelText("Unfavorite"));
        expect(await within(cashCard).findByLabelText("Favorite")).toBeInTheDocument();

        const favs2 = JSON.parse(localStorage.getItem("accountFavs") || "{}");
        const anyFavStillTrue = Object.values(favs2).some((v: any) => v?.favorite === true);
        expect(anyFavStillTrue).toBe(false);
    });

    it("ควรจัดรายการที่ favorite ไว้ด้านบนสุด (ทำให้ favorite ระหว่างเทสต์)", async () => {
        const user = userEvent.setup();
        const { container } = renderComponent();

        await waitFor(() => expect(findCardByTitle(container, "บัญชี ออมสิน")).toBeTruthy());

        // กด favorite 'บัญชี ออมสิน' ให้ขึ้นบนสุด
        const gsCard = findCardByTitle(container, "บัญชี ออมสิน")!;
        await user.click(within(gsCard).getByLabelText("Favorite"));

        // รอให้จัดเรียงใหม่
        await waitFor(() => {
            const cards = Array.from(container.querySelectorAll<HTMLButtonElement>(".card.mini"));
            expect(cards.length).toBeGreaterThan(0);
            const titles = cards.map((el) => el.querySelector(".mini__title")?.textContent?.trim());
            expect(titles[0]).toBe("บัญชี ออมสิน");
        });
    });

    it("ควรเลือกบัญชี, เรียก setPayment, และ navigate(-1) เมื่อเงินพอ", async () => {
        const user = userEvent.setup();
        const { container } = renderComponent();

        sessionStorage.setItem("pendingExpenseAmount", "500");

        await waitFor(() => expect(findCardByTitle(container, "เงินสด")).toBeTruthy());
        const cashCard = findCardByTitle(container, "เงินสด")!;
        await user.click(cashCard);

        expect(mockSetPayment).toHaveBeenCalledTimes(1);
        // ✅ ไม่ล็อกค่า id ตายตัว (อิง API) — เช็กว่าเป็น string ก็พอ
        expect(mockSetPayment).toHaveBeenCalledWith(
            expect.objectContaining({
                id: expect.any(String),
                name: "เงินสด",
                favorite: false,
            })
        );
        expect(mockNavigate).toHaveBeenCalledWith(-1);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it("ควรแสดง alert และไม่เลือกบัญชี เมื่อเงินไม่พอ", async () => {
        const user = userEvent.setup();
        const { container } = renderComponent();

        sessionStorage.setItem("pendingExpenseAmount", "1000"); // 'บัญชี ออมสิน' มี 200

        await waitFor(() => expect(findCardByTitle(container, "บัญชี ออมสิน")).toBeTruthy());
        const lowCard = findCardByTitle(container, "บัญชี ออมสิน")!;
        await user.click(lowCard);

        expect(window.alert).toHaveBeenCalledTimes(1);
        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('ยอดเงินในบัญชี "บัญชี ออมสิน" มี 200 บาท')
        );
        expect(mockSetPayment).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("ควรกด Escape เพื่อปิด dropdown ของ filter", async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole("button", { name: /ทั้งหมด/ }));
        expect(screen.getByRole("listbox")).toBeInTheDocument();

        fireEvent.keyDown(window, { key: "Escape" });
        await waitFor(() => {
            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        });
    });
});
