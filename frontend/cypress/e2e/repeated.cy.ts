/// <reference types="cypress" />

describe("Repeated Page", () => {
    beforeEach(() => {
        // CI login fix
        cy.window().then(win => {
            win.sessionStorage.setItem("token", "test-token");
            win.sessionStorage.setItem(
                "user",
                JSON.stringify({ username: "admin", role: "USER" })
            );
        });

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
        }).as("repList");

        cy.visit("/repeated-transactions");
    });

    it("renders repeated list", () => {
        cy.wait("@repList");
        cy.contains("Netflix").should("exist");
    });
});
