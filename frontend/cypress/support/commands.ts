/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

import '@testing-library/cypress/add-commands'

declare global {
    namespace Cypress {
        interface Chainable {
            mockLoginFrontendOnly(username?: string): Chainable<void>
        }
    }
}

Cypress.Commands.add('mockLoginFrontendOnly', (username: string = 'admin') => {
    const user = { username, role: 'USER' }

    cy.session(['fe-mock', username], () => {
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { ok: true, user, token: 'e2e-token' },
        }).as('apiLogin')

        cy.intercept('GET', '/api/auth/me', {
            statusCode: 200,
            body: { ok: true, user },
        }).as('apiMe')

        cy.visit('/login', { failOnStatusCode: false })
        cy.window().then((win) => {
            win.sessionStorage.setItem('isAuthenticated', 'true')
            win.sessionStorage.setItem('user', JSON.stringify(user))
            win.localStorage.setItem('auth_user', JSON.stringify(user))
            win.localStorage.setItem('auth_token', 'e2e-token')
            win.dispatchEvent(new Event('auth-changed'))
        })
        cy.visit('/home', { failOnStatusCode: false })
        cy.url().should('include', '/home')
    }, { cacheAcrossSpecs: true })
})

export {}
