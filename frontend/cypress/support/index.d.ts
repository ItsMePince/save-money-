/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            mockLoginFrontendOnly(username?: string): Chainable<void>
        }
    }
}

export {}
