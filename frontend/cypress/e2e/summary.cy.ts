/// <reference types="cypress" />

describe("Summary Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/accounts*", {
            statusCode: 200,
            body: [{ id: 1, name: "บัญชีหลัก", amount: 5000 }]
        }).as("acc");

        cy.intercept("GET", "**/api/expenses/range*", {
            statusCode: 200,
            body: [{ id: 1, type: "EXPENSE", amount: 500 }]
        }).as("range");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("rep");
    });

    it("renders summary page", () => {
        cy.visit("/summary");
        cy.wait(["@acc", "@range", "@rep"]);

        cy.contains("5000").should("exist");
        cy.contains("500").should("exist");

        cy.get("svg.recharts-surface").should("be.visible");
    });
});
