// cypress/e2e/repeated.cy.ts
/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {

    beforeEach(() => {
        // **** mock login ****
        cy.mockLoginFrontendOnly("admin");

        // **** mock API ****
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("getList");

        // **** visit page ****
        cy.visit("/repeated");
        cy.wait("@getList");

        // 🧨 DEBUG: print หน้า HTML ของ CI เพื่อดูว่ามันขึ้นอะไรจริง
        cy.document().then((doc) => {
            const txt = doc.documentElement.innerText.substring(0, 3000);
            console.log("🔥🔥 PAGE TEXT (CI) 🔥🔥\n" + txt);
        });
    });

    it("แสดงหัวข้อและ empty state ถูกต้อง", () => {
        cy.contains("ธุรกรรมที่เกิดซ้ำ").should("exist");
        cy.contains("ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถเปิดฟอร์มเพิ่มรายการได้", () => {
        cy.get("button:has(svg)").first().click();
        cy.contains("เพิ่มธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถกรอกฟอร์ม + submit ได้", () => {
        cy.get("button:has(svg)").first().click();

        cy.get('input[name="name"]').type("Netflix");
        cy.get('input[name="amount"]').type("300");

        cy.contains("ยืนยัน").click();
        // ไม่ test ด้าน backend เพราะ mock อยู่
    });
});
