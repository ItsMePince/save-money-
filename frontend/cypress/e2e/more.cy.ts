/// <reference types="cypress" />

describe("More Page", () => {
    beforeEach(() => {
        // force login for CI
        cy.window().then(win => {
            win.sessionStorage.setItem("token", "test-token");
            win.sessionStorage.setItem(
                "user",
                JSON.stringify({ username: "admin", role: "USER" })
            );
        });

        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "บัญชีหลัก",
                    amount: 5000,
                    iconKey: "bank"
                }
            ]
        }).as("acc");

        cy.visit("/more");
    });

    it("renders More page", () => {
        cy.wait("@acc");
        cy.contains("บัญชีหลัก").should("exist");
    });
});
