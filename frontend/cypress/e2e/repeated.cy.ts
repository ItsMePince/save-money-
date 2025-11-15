/// <reference types="cypress" />

describe("Repeated Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/repeated-transactions", {
            statusCode: 200,
            body: [
                { id: 1, name: "Netflix", amount: 300, date: 15 }
            ]
        });
    });

    it("renders repeated list", () => {
        cy.visit("/repeated-transactions");
        cy.contains("Netflix").should("be.visible");
    });
});
