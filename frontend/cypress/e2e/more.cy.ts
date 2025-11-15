/// <reference types="cypress" />

describe("More Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [
                { id: 1, name: "บัญชีหลัก", amount: 4500 }
            ]
        });
    });

    it("renders More page", () => {
        cy.visit("/more");
        cy.contains("บัญชีหลัก").should("be.visible");
    });
});
