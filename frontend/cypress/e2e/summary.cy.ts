describe("Summary Page", () => {

    const mockExpenses = [
        {
            id: 1,
            type: "EXPENSE",
            category: "ค่าเดินทาง",
            amount: 89,
            note: "test",
            paymentMethod: "",
            occurredAt: "2025-11-15T10:00:00"
        }
    ];

    beforeEach(() => {
        cy.intercept("GET", "**/api/accounts*", { statusCode: 200, body: [] });
        cy.intercept("GET", "**/api/repeated-transactions*", { statusCode: 200, body: [] });
        cy.intercept("GET", "**/api/expenses/range*", { statusCode: 200, body: [] });

        cy.intercept("GET", "**/api/expenses*", {
            statusCode: 200,
            body: mockExpenses
        }).as("expenses");

        cy.mockLoginFrontendOnly();
        cy.visit("/summary");
    });

    it("renders summary page", () => {
        cy.wait("@expenses");

        cy.contains("รวม").should("exist");
        cy.contains("ค่าเดินทาง").should("exist");
        cy.contains("-89").should("exist");
    });
});