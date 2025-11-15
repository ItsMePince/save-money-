describe("More Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly();

        const mockAccounts = [
            {
                id: 1,
                name: "บัญชีหลัก",
                amount: 5000,
                iconKey: "bank"
            }
        ];

        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: mockAccounts
        }).as("acc");

        cy.visit("/more");
    });

    it("renders More page", () => {
        cy.wait("@acc");

        cy.contains("บัญชีหลัก").should("exist");
        cy.contains("5000").should("exist");
    });
});
