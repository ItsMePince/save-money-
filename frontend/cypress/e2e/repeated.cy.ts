describe('Repeated Page', () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin');

        cy.intercept('GET', '**/api/repeated-transactions', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: 'Netflix',
                    amount: 300,
                    type: 'EXPENSE',
                    date: 15
                }
            ]
        }).as('rep');

        cy.visit('/repeated-transactions');
        cy.wait('@rep');
    });

    it('renders repeated list', () => {
        cy.contains('Netflix').should('exist');
        cy.contains('300').should('exist');
    });

});
