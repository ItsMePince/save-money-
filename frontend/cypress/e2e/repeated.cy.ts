// cypress/e2e/repeated.cy.ts
/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {

    beforeEach(() => {
        cy.clock(Date.now(), ["Date"]);

        // 1) mock login
        cy.mockLoginFrontendOnly("admin");

        // 2) ป้องกัน redirect ไป /home (ปัญหาหลักบน CI)
        cy.window().then((win) => {
            win.history.pushState({}, "", "/repeated");
        });

        // 3) mock API
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("getList");

        // 4) visit หน้าแบบไม่ fail
        cy.visit("/repeated", { failOnStatusCode: false });

        // 5) รอ API sync
        cy.wait("@getList");

        // 6) DEBUG (จำเป็นมากบน CI)
        cy.document().then((doc) => {
            const txt = doc.documentElement.innerText.substring(0, 2500);
            console.log("🔥 PAGE HTML (CI) 🔥\n", txt);
        });
    });

    // ----------------------------------------------------
    // 1) HEADER + EMPTY STATE
    // ----------------------------------------------------
    it("แสดงหัวข้อและ empty state ถูกต้อง", () => {
        cy.contains("ธุรกรรมที่เกิดซ้ำ").should("exist");
        cy.contains("ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    // ----------------------------------------------------
    // 2) OPEN FORM
    // ----------------------------------------------------
    it("สามารถเปิดฟอร์มเพิ่มรายการได้", () => {
        cy.get("button:has(svg)")
            .first()
            .should("be.visible")
            .click();

        cy.contains("เพิ่มธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    // ----------------------------------------------------
    // 3) SUBMIT FORM
    // ----------------------------------------------------
    it("สามารถกรอกฟอร์ม + submit ได้", () => {
        // เปิดฟอร์ม
        cy.get("button:has(svg)").first().click();

        // กรอกข้อมูล
        cy.get('input[name="name"]').type("Netflix");
        cy.get('input[name="amount"]').type("300");

        // mock POST
        cy.intercept("POST", "**/api/repeated-transactions", {
            statusCode: 200,
            body: { success: true }
        }).as("create");

        // กด submit
        cy.contains("ยืนยัน").click();

        cy.wait("@create");
    });

});
