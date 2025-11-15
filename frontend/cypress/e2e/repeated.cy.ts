/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("getList");

        cy.visit("/repeated");
        cy.wait("@getList");
    });

    it("แสดงหัวข้อและ empty state ถูกต้อง", () => {
        // ใช้ regex เพื่อเลี่ยงปัญหา unicode
        cy.contains(/ธุรกรรมที่เกิด/).should("exist");

        cy.contains("ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถเปิดฟอร์มเพิ่มรายการได้", () => {
        // ค้นหาปุ่ม + แบบ generic ที่ตรง UI จริง
        cy.get('button:has(svg)').first().click();

        cy.contains(/เพิ่มธุรกรรม/).should("exist");
    });

    it("สามารถกรอกฟอร์ม + submit ได้", () => {
        cy.get('button:has(svg)').first().click();

        cy.intercept("POST", "**/api/repeated-transactions", {
            statusCode: 200,
            body: { id: 1 }
        }).as("postCreate");

        cy.get('input[placeholder="ชื่อธุรกรรม"]').type("ค่ากินข้าว");

        cy.contains("เลือกบัญชี").click();
        cy.contains("บัญชี").first().click();

        cy.get('input[placeholder="0.00"]').type("150");

        cy.contains("ยืนยัน").click();
        cy.wait("@postCreate");

        // mock reload list
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "ค่ากินข้าว",
                    amount: 150
                }
            ]
        }).as("reloadList");

        cy.visit("/repeated");
        cy.wait("@reloadList");

        cy.contains("ค่ากินข้าว").should("exist");
    });

});
