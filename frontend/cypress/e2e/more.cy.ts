describe('More Page', () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin');

        cy.intercept('GET', '**/api/accounts', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: 'บัญชีหลัก',
                    amount: 5000,
                    iconKey: 'bank'
                }
            ]
        }).as('acc');

        cy.visit('/more');
        cy.wait('@acc');
    });

    it('renders More page', () => {
        cy.contains('บัญชีหลัก').should('exist');
        cy.contains('5000').should('exist');
    });

});
