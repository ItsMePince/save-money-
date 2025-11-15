/// <reference types="cypress" />

describe("Repeated Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.visit("/repeated-transactions");

        // รอให้หน้า mount ก่อน (สำคัญมากสำหรับ CI)
        cy.wait(300);

        // override API หลังหน้าโหลดแล้ว
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
        cy.wait("@repList", { timeout: 8000 });
        cy.contains("Netflix").should("exist");
        cy.contains("300").should("exist");
    });
});
