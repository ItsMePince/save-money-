/// <reference types="cypress" />

// =====================
// GLOBAL DEBUG LOGGER
// =====================
Cypress.on("fail", (err) => {
    return cy.document().then((doc) => {
        const out = [
            "==== HTML START ====",
            doc.documentElement.outerHTML,
            "==== HTML END ====",
            "",
            "==== TEXT START ====",
            doc.body.innerText,
            "==== TEXT END ====",
        ].join("\n\n");

        cy.writeFile("cypress-logs/repeated-dom.txt", out);
        throw err;
    });
});

// =====================
// TEST
// =====================
describe("Repeated Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly();

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "Netflix",
                    amount: 300,
                    date: 15,
                    type: "EXPENSE",
                    iconKey: "netflix"
                }
            ]
        }).as("repList");
    });

    it("renders repeated list", () => {
        cy.visit("/repeated-transactions");
        cy.wait("@repList");

        cy.contains("Netflix").should("exist");
        cy.contains("300").should("exist");
    });
});
