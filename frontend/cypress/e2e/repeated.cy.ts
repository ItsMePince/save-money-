/// <reference types="cypress" />

const PAGE_PATH = "/recurring";

/* ---------- Only stub for create ---------- */
function stubAccounts() {
    cy.intercept("GET", "/api/accounts", {
        statusCode: 200,
        body: [
            { id: 1, name: "K-Bank", amount: 10000 },
            { id: 2, name: "SCB", amount: 5000 },
            { id: 3, name: "Wallet", amount: 3000 },
        ],
    }).as("getAccounts");
}

function stubCreate() {
    cy.intercept("POST", "/api/repeated-transactions", (req) => {
        req.reply({ statusCode: 201, body: { id: 999, ...req.body } });
    }).as("createTx");

    cy.intercept("GET", "/api/repeated-transactions*", {
        statusCode: 200,
        fixture: "repeated-after-create.json",
    }).as("getListAfterCreate");
}

describe("Recurring Transactions (New stable tests)", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("e2e");

        // only stub accounts (safe)
        stubAccounts();

        cy.visit(PAGE_PATH);

        // หน้า Recurring ต้องมา
        cy.url().should("include", "/recurring");
    });

    it("สามารถเพิ่มรายการใหม่ได้สำเร็จ", () => {
        stubCreate(); // stub เฉพาะ create flow

        cy.get(".add-btn").click();

        cy.wait("@getAccounts");

        cy.get("input").eq(0).clear().type("Spotify Family");
        cy.get("select").eq(0).select("K-Bank");
        cy.get('input[type="number"]').clear().type("199");

        cy.get('input[type="date"]')
            .invoke("val", "2025-11-10")
            .trigger("change", { force: true });

        cy.get("select").eq(1).select("ทุกเดือน");

        cy.get(".submit-btn").scrollIntoView().click({ force: true });

        cy.wait("@createTx");
        cy.wait("@getListAfterCreate");

        cy.contains("Spotify Family").should("be.visible");
    });
});
