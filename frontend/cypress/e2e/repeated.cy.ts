/// <reference types="cypress" />

describe("Repeated Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [
                { id: 1, name: "Netflix", amount: 300, date: 15, type: "EXPENSE" }
            ]
        }).as("rep");
    });

    it("renders repeated list", () => {
        cy.visit("/repeated");
        cy.wait("@rep");

        cy.contains("Netflix").should("exist");
        cy.contains("300").should("exist");
    });
});
