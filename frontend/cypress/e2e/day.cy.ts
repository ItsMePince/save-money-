/// <reference types="cypress" />

function mockDayRange() {
    return [
        {
            id: 1,
            type: "EXPENSE",
            category: "อาหาร",
            amount: 100,
            occurredAt: "2025-11-03T12:00:00"
        },
        {
            id: 2,
            type: "INCOME",
            category: "โบนัส",
            amount: 300,
            occurredAt: "2025-11-03T15:00:00"
        }
    ];
}

describe("Day Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/expenses/range*", {
            statusCode: 200,
            body: mockDayRange()
        }).as("range");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("rep");
    });

    it("renders day data correctly", () => {
        cy.visit("/day?date=2025-11-03");
        cy.wait(["@range", "@rep"]);

        cy.contains("03/11/2568").should("exist");
        cy.contains("100").should("exist");
        cy.contains("300").should("exist");

        cy.get("svg.recharts-surface").should("be.visible");
    });
});
