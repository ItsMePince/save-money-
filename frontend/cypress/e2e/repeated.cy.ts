/// <reference types="cypress" />

describe("Repeated Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/repeated-transactions*", (req) => {
            console.log("🔥 intercepted repeated-transactions");
            req.reply({
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
            });
        }).as("repList");

        cy.visit("/repeated-transactions");

        // บังคับให้ frontend ยิง request อีกรอบหลัง intercept พร้อมแล้ว
        cy.reload();
        cy.wait("@repList", { timeout: 10000 });

        // log DOM ทั้งหน้า (เพื่อ debug CI)
        cy.document().then((doc) => {
            console.log("🔥 DOM text:\n", doc.body.innerText);
        });
    });

    it("renders repeated list", () => {
        // ตรวจ root container ของ list
        cy.get(".repeated-list, .list, body").then(($root) => {
            const text = $root.text();
            console.log("🔥 List TEXT:", text);
        });

        // ตรวจข้อความที่ mock
        cy.contains("Netflix", { timeout: 8000 }).should("exist");
    });
});
