/// <reference types="cypress" />

describe("Summary Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [{ id: 1, name: "บัญชีหลัก", amount: 1000 }]
        });

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        });

        cy.intercept("GET", "**/api/expenses*", {
            statusCode: 200,
            body: []
        });
    });

    it("renders summary page", () => {
        cy.visit("/summary");
        cy.contains("สรุปภาพรวม").should("be.visible");
    });
});
