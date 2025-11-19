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

Cypress.Commands.add("mockLoginFrontendOnly", (username = "admin") => {
    cy.window().then((win) => {
        const user = {
            id: 1,
            username,
            email: username + "@example.com",
            role: "USER"
        };

        win.sessionStorage.setItem("isAuthenticated", "true");
        win.sessionStorage.setItem("user", JSON.stringify(user));
        win.location.href = "/home";
    });
});

export {}
