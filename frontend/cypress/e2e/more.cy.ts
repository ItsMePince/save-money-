/// <reference types="cypress" />

describe("More Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/accounts*", {
            statusCode: 200,
            body: [{ id: 1, name: "บัญชีหลัก", amount: 5000 }]
        }).as("acc");
    });

    it("renders More page", () => {
        cy.visit("/more");
        cy.wait("@acc");

        cy.contains("บัญชีหลัก").should("exist");
        cy.contains("5000").should("exist");
    });
});
