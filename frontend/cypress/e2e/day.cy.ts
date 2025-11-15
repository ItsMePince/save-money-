/// <reference types="cypress" />

function makeDayData(yyyy: number, mm: number) {
    const m = String(mm).padStart(2, "0");
    return [
        {
            id: Number(`${yyyy}${m}01`),
            type: "EXPENSE",
            category: "อาหาร",
            amount: 100,
            occurredAt: `${yyyy}-${m}-03T12:00:00`,
        },
        {
            id: Number(`${yyyy}${m}02`),
            type: "INCOME",
            category: "เงินเดือน",
            amount: 300,
            occurredAt: `${yyyy}-${m}-10T09:00:00`,
        },
        {
            id: Number(`${yyyy}${m}03`),
            type: "EXPENSE",
            category: "เดินทาง",
            amount: 900,
            occurredAt: `${yyyy}-${m}-22T08:30:00`,
        },
    ];
}

const TARGET_DATE_ISO = "2025-11-03";
const TARGET_THAI = "03/11/2568";

const forceRechartsRender = () => {
    cy.window().then((win) => {
        if (!(win as any).ResizeObserver) {
            class RO {
                private cb: any;
                constructor(cb: any) { this.cb = cb; }
                observe() { this.cb([{ contentRect: { width: 900, height: 300 } }]); }
                unobserve() {}
                disconnect() {}
            }
            (win as any).ResizeObserver = RO as any;
        }
        win.dispatchEvent(new Event("resize"));
    });
};

function getChart() {
    return cy.get("svg.recharts-surface", { timeout: 8000 }).first();
}

describe("Day Page", () => {
    beforeEach(() => {
        cy.clock(new Date("2025-11-10T10:00:00.000Z").getTime(), ["Date"]);
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/expenses/range*", (req) => {
            const url = new URL(req.url);
            const start = url.searchParams.get("start");
            let yyyy, mm;

            if (start) {
                const [y, m] = start.split("-").map(Number);
                yyyy = y;
                mm = m;
            } else {
                const d = new Date();
                yyyy = d.getFullYear();
                mm = d.getMonth() + 1;
            }

            const base = makeDayData(yyyy, mm);
            const m2 = String(mm).padStart(2, "0");

            base.push({
                id: Number(`${yyyy}${m2}99`),
                type: "INCOME",
                category: "เงินพิเศษ",
                amount: 250,
                occurredAt: `${yyyy}-${m2}-03T15:00:00`,
            });

            req.reply({ statusCode: 200, body: base });
        }).as("getRange");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [],
        }).as("getRepeated");
    });

    it("loads day page and renders list + chart", () => {
        cy.visit(`/day?date=${TARGET_DATE_ISO}`);
        cy.wait(["@getRange", "@getRepeated"]);

        cy.get(".date-chip", { timeout: 8000 }).should("contain.text", TARGET_THAI);

        cy.get(".item").should("have.length.at.least", 1);

        cy.contains("100").should("exist");
        cy.contains("250").should("exist");

        forceRechartsRender();
        getChart().should("be.visible");
    });

    it("shows correct income/expense totals", () => {
        cy.visit(`/day?date=${TARGET_DATE_ISO}`);
        cy.wait(["@getRange", "@getRepeated"]);
        forceRechartsRender();

        cy.contains("250").should("exist");
        cy.contains("100").should("exist");
    });
});
