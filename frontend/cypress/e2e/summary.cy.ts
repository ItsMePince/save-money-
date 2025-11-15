// cypress/e2e/summary.cy.ts

describe('Summary Page', () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin');

        cy.intercept('GET', '**/api/expenses', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    type: 'EXPENSE',
                    amount: 89,
                    category: 'ค่าเดินทาง',
                    note: 'test',
                    occurredAt: '2025-11-15T12:00:00'
                }
            ]
        }).as('exp');

        cy.intercept('GET', '**/api/repeated-transactions', {
            statusCode: 200,
            body: []
        }).as('rep');

        cy.visit('/summary');
        cy.wait(['@exp', '@rep']);
    });

    it('renders summary page', () => {
        cy.contains('สรุปภาพรวม').should('exist');
        cy.contains('-89').should('exist');
        cy.contains('ค่าเดินทาง').should('exist');
    });

});
