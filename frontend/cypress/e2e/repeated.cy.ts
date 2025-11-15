/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        // mock API ให้ predictable
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: []
        }).as("getList");

        cy.visit("/repeated");
        cy.wait("@getList");
    });

    it("แสดงหัวข้อและ empty state ถูกต้อง", () => {
        cy.contains("ธุรกรรมที่เกิดซ้ำ").should("exist");
        cy.contains("ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถเปิดฟอร์มเพิ่มรายการได้", () => {
        cy.get(".add-btn").click();

        // หน้า AddTransaction ต้องมีคำนี้เสมอ
        cy.contains("เพิ่มธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถกรอกฟอร์ม + submit ได้", () => {
        cy.get(".add-btn").click();

        // mock API ตอน submit
        cy.intercept("POST", "**/api/repeated-transactions", {
            statusCode: 200,
            body: { success: true }
        }).as("postCreate");

        // กรอกข้อมูล
        cy.get('input[placeholder="ชื่อธุรกรรม"]').type("ค่ากินข้าว");
        cy.contains("เลือกบัญชี").click();
        cy.contains("บัญชี").click();
        cy.get('input[placeholder="0.00"]').type("150");

        cy.contains("ยืนยัน").click();
        cy.wait("@postCreate");

        // mock reload list ให้มีข้อมูล 1 รายการ
        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "ค่ากินข้าว",
                    account: "บัญชี A",
                    amount: 150,
                    date: "2025-11-15",
                    frequency: "MONTHLY"
                }
            ]
        }).as("reloadList");

        cy.visit("/repeated");
        cy.wait("@reloadList");

        cy.contains("ค่ากินข้าว").should("exist");
    });

});
