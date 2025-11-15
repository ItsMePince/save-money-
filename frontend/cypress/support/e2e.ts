import './commands'
import '@testing-library/cypress/add-commands'


beforeEach(() => {
    cy.mockLoginFrontendOnly();

    const mockExpenses = [
        {
            id: 1,
            type: "EXPENSE",
            category: "อาหาร",
            amount: 150,
            note: "test",
            place: "BKK",
            occurredAt: "2025-01-05T08:00:00",
            paymentMethod: "CASH",
            iconKey: "food"
        }
    ];

    const mockAccounts = [
        {
            id: 1,
            name: "บัญชีหลัก",
            amount: 5000,
            iconKey: "bank"
        }
    ];

    const mockRepeated = [
        {
            id: 1,
            name: "Netflix",
            amount: 300,
            date: 15,
            type: "EXPENSE",
            iconKey: "netflix"
        }
    ];

    cy.intercept("GET", "**/api/accounts", { statusCode: 200, body: mockAccounts }).as("acc");
    cy.intercept("GET", "**/api/expenses*", { statusCode: 200, body: mockExpenses }).as("exp");
    cy.intercept("GET", "**/api/expenses/range*", { statusCode: 200, body: mockExpenses }).as("range");
    cy.intercept("GET", "**/api/repeated-transactions", { statusCode: 200, body: mockRepeated }).as("rep");
});
