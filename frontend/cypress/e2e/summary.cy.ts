/// <reference types="cypress" />

describe("Summary Page", () => {
    beforeEach(() => {
        // mock login ที่ CI ต้องใช้
        cy.window().then(win => {
            win.sessionStorage.setItem("token", "test-token");
            win.sessionStorage.setItem(
                "user",
                JSON.stringify({ username: "admin", role: "USER" })
            );
        });

        // mock API
        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [{ id: 1, name: "บัญชีหลัก", amount: 5000 }]
        }).as("acc");

        cy.intercept("GET", "**/api/expenses*", {
            statusCode: 200,
            body: []
        }).as("exp");

        cy.intercept("GET", "**/api/repeated-transactions", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "Netflix",
                    amount: 300,
                    date: 15,
                    type: "EXPENSE",
                    iconKey: "netflix"
                }
            ]
        }).as("rep");

        cy.visit("/summary");
    });

    it("renders summary page", () => {
        cy.wait("@rep");
        cy.contains("Netflix").should("exist");
    });
});
