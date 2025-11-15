/// <reference types="cypress" />

describe("Repeated Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        // 1) ตั้ง intercept ก่อน
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "Netflix",
                    amount: 300,
                    date: 15,
                    type: "EXPENSE",
                    iconKey: "netflix",
                },
            ],
        }).as("repList");

        // 2) เข้าเพจ
        cy.visit("/repeated-transactions");

        // 3) บังคับ reload 1 ครั้ง ให้ frontend ยิง API ใหม่รอบสอง
        cy.reload();

        // 4) รอ request ที่ intercept แน่ๆ
        cy.wait("@repList", { timeout: 10000 });
    });

    it("renders repeated list", () => {
        cy.contains("Netflix").should("exist");
        cy.contains("300").should("exist");
    });
});
