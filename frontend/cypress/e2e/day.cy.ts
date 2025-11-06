/// <reference types="cypress" />

const API_BASE = "http://localhost:8081";

const openDayFromMonth = (dateISO: string) => {
    cy.location("pathname").then((p) => {
        if (!/\/month$/.test(p)) {
            cy.visit(`/month?year=${dateISO.slice(0, 4)}&month=${parseInt(dateISO.slice(5, 7), 10)}`);
            cy.location("pathname").should("include", "/month");
        }
    });

    cy.get(`a.row[href="/day?date=${dateISO}"]`, { timeout: 8000 })
        .should("exist")
        .click({ force: true });

    cy.location("search", { timeout: 10000 }).should("include", `date=${dateISO}`);
};

const waitForPie = () => {
    cy.window().then((win) => win.dispatchEvent(new Event("resize")));
    cy.get("svg.recharts-surface", { timeout: 8000 }).should("exist");
    cy.wait(200);
};

describe("Day page: list + pie (robust)", () => {
    beforeEach(() => {
        cy.clock(new Date("2025-11-05T10:00:00.000Z").getTime());

        cy.on("window:before:load", (win: any) => {
            if (!win.ResizeObserver) {
                class RO {
                    _cb: any;
                    constructor(cb: any) { this._cb = cb; }
                    observe() { this._cb?.([{ contentRect: { width: 900, height: 300 } }]); }
                    unobserve() {}
                    disconnect() {}
                }
                win.ResizeObserver = RO as any;
            }
            if (!win.matchMedia) {
                win.matchMedia = () =>
                    ({ matches: false, addListener() {}, removeListener() {} } as any);
            }
        });

        const store: Array<{
            id: string;
            occurredAt: string;
            amount: number;
            type: "EXPENSE" | "INCOME";
            category?: string;
        }> = [];

        cy.intercept("POST", `${API_BASE}/api/auth/login`, {
            statusCode: 200,
            body: { success: true, user: { id: 1, username: "zoo" } },
        }).as("login");

        cy.intercept("GET", "**/api/accounts*", {
            statusCode: 200,
            body: [{ id: 1, name: "My Cash Wallet" }],
        }).as("getAccs");

        cy.intercept("POST", `${API_BASE}/api/accounts`, {
            statusCode: 201,
            body: { id: 1 },
        }).as("postAcc");

        cy.intercept("POST", `${API_BASE}/api/expenses`, (req) => {
            const b = req.body as any;
            const newId = `e${store.length + 1}`;
            store.push({
                id: newId,
                occurredAt: String(b.occurredAt || "2025-11-05T10:00:00").slice(0, 10),
                amount: Number(b.amount || 0),
                type: (b.type as any) || "EXPENSE",
                category: b.category || "อาหาร",
            });
            req.reply({ statusCode: 201, body: { id: newId } });
        }).as("postExpense");

        cy.intercept({ method: "GET", pathname: "/api/expenses/range" }, (req) => {
            const { start, end } = req.query as any;
            const data = store.filter((x) => x.occurredAt >= start && x.occurredAt <= end);
            req.reply({
                statusCode: 200,
                body: data.map((d) => ({
                    id: d.id,
                    occurredAt: d.occurredAt,
                    amount: d.amount,
                    type: d.type,
                    category: d.category,
                })),
            });
        }).as("getRange");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [],
        }).as("getRepeated");
    });

    it("single expense on 05/11/2025 shows one list item and pie renders", () => {
        cy.visit("/login");
        cy.get('input[placeholder="username"]').type("zoo");
        cy.get('input[placeholder="password "]').type("password");
        cy.contains("button", "login").click();
        cy.wait("@login");

        cy.visit("/accountnew");
        cy.get('input[placeholder="ชื่อบัญชี"]').type("My Cash Wallet");
        cy.get("button.select").click();
        cy.contains("button.opt", "เงินสด").click();
        cy.get('input.input.number[aria-label="จำนวนเงิน"]').type("2000");
        cy.contains("button.primary", /ยืนยัน|บันTึกการแก้ไข/).click();
        cy.wait("@postAcc");

        cy.visit("/expense");
        cy.get("input.amount-input").clear().type("400");
        cy.window().then((win) => win.sessionStorage.setItem("selectedPlaceName", "Lotus"));
        cy.contains("button.seg", /ประเภทการชำระเงิน|Payment|Method/i).click();
        cy.wait("@getAccs");
        cy.contains(/My Cash Wallet|เงินสด|Cash/i).click();
        cy.get(".confirm .ok-btn").click();
        cy.wait("@postExpense");

        cy.visit("/month?year=2025&month=11");
        cy.wait(["@getRange", "@getRepeated"]);
        openDayFromMonth("2025-11-05");
        cy.wait("@getRange");

        cy.get(".date-chip").should("contain.text", "05/11/2568");

        cy.get(".item").should("have.length.at.least", 1).first().within(() => {
            cy.get(".name").should("contain.text", "อาหาร");
            cy.get(".amount").invoke("text").should("match", /\b400\b/);
            cy.get(".percent").invoke("text").then((t) => {
                expect(String(t).replace(/\s+/g, "")).to.match(/100%/);
            });
        });

        waitForPie();
    });

    it("expense 400 + income 250 on 05/11 shows two items and pie renders", () => {
        cy.visit("/login");
        cy.get('input[placeholder="username"]').type("zoo");
        cy.get('input[placeholder="password "]').type("password");
        cy.contains("button", "login").click();
        cy.wait("@login");

        cy.visit("/accountnew");
        cy.get('input[placeholder="ชื่อบัญชี"]').type("My Cash Wallet");
        cy.get("button.select").click();
        cy.contains("button.opt", "เงินสด").click();
        cy.get('input.input.number[aria-label="จำนวนเงิน"]').type("5000");
        cy.contains("button.primary", /ยืนยัน|บันTึกการแก้ไข/).click();
        cy.wait("@postAcc");

        cy.visit("/expense");
        cy.get("input.amount-input").clear().type("400");
        cy.window().then((win) => win.sessionStorage.setItem("selectedPlaceName", "Lotus"));
        cy.contains("button.seg", /ประเภทการชำระเงิน|Payment|Method/i).click();
        cy.wait("@getAccs");
        cy.contains(/My Cash Wallet|เงินสด|Cash/i).click();
        cy.get(".confirm .ok-btn").click();
        cy.wait("@postExpense");

        cy.visit("/income");
        cy.get("input.amount-input").clear().type("250");
        cy.window().then((win) => win.sessionStorage.setItem("selectedPlaceName", "Bonus"));
        cy.contains("button.seg", /ประเภทการชำระเงิน|Payment|Method/i).click();
        cy.wait("@getAccs");
        cy.contains(/My Cash Wallet|เงินสด|Cash/i).click();
        cy.get(".confirm .ok-btn").click();
        cy.wait("@postExpense");

        cy.visit("/month?year=2025&month=11");
        cy.wait(["@getRange", "@getRepeated"]);
        openDayFromMonth("2025-11-05");
        cy.wait("@getRange");

        cy.get(".date-chip").should("contain.text", "05/11/2568");


        cy.get(".item .amount").then(($amts) => {
            const text = $amts.toArray().map((n) => (n.textContent || "")).join(" ");
            expect(text).to.include("400");
            expect(text).to.include("250");
        });

        waitForPie();
    });
});