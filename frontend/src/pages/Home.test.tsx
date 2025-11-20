import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Home from "./Home";

// Mock navigate()
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock BottomNav
vi.mock("./buttomnav", () => ({
    default: () => <div data-testid="bottom-nav">BottomNav</div>,
}));

// Helper
const renderWithRouter = (ui: React.ReactElement) =>
    render(<BrowserRouter>{ui}</BrowserRouter>);

describe("Home Component (Clean Version)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -------------------------
    // INITIAL RENDER
    // -------------------------
    describe("Initial Rendering", () => {
        it("should render balance card", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            renderWithRouter(<Home />);
            expect(screen.getByText("เงินรวม")).toBeInTheDocument();
            expect(screen.getByText(/บาท/)).toBeInTheDocument();
        });

        it("should render action buttons", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            renderWithRouter(<Home />);

            await waitFor(() => {
                expect(screen.getByText("ทั้งหมด")).toBeInTheDocument();
                expect(screen.getByText("รายได้")).toBeInTheDocument();
                expect(screen.getByText("ค่าใช้จ่าย")).toBeInTheDocument();
            });
        });

        it("should render month/year text", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            renderWithRouter(<Home />);

            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            await waitFor(() => {
                expect(screen.getByText(`${month}/${year}`)).toBeInTheDocument();
            });
        });

        it("should show BottomNav", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            renderWithRouter(<Home />);
            expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
        });
    });

    // -------------------------
    // FETCH ACCOUNTS
    // -------------------------
    it("should display accounts on load", async () => {
        const mockAccounts = [
            { id: 1, name: "ธนาคารกสิกร", amount: 5000, iconKey: "bank" },
            { id: 2, name: "กระเป๋าเงิน", amount: 1500, iconKey: "wallet" },
        ];

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockAccounts,
        });

        renderWithRouter(<Home />);

        await waitFor(() => {
            const bankEls = screen.getAllByText("ธนาคารกสิกร");
            expect(bankEls.length).toBeGreaterThan(0);

            const walletEls = screen.getAllByText("กระเป๋าเงิน");
            expect(walletEls.length).toBeGreaterThan(0);

            expect(screen.getByText("5,000 บาท")).toBeInTheDocument();
            expect(screen.getByText("1,500 บาท")).toBeInTheDocument();
        });
    });


    it("should navigate to login on 401", async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 401,
            });

            renderWithRouter(<Home />);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith("/login");
            });
        });
    });



    // -------------------------
    // NAVIGATION LINKS
    // -------------------------
    describe("Navigation Links", () => {
        it("should have link to summary page", async () => {
            (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [] });

            renderWithRouter(<Home />);

            const link = screen.getByText("ดูทั้งหมด");
            expect(link).toHaveAttribute("href", "/summary");
        });

        it("should have link to add account", async () => {
            (global.fetch as any).mockResolvedValue({ ok: true, json: async () => [] });

            renderWithRouter(<Home />);

            await waitFor(() => {
                const links = screen.getAllByRole("link");
                const found = links.find((l) => l.getAttribute("href") === "/accountnew");
                expect(found).toBeTruthy();
            });
        });
    });
