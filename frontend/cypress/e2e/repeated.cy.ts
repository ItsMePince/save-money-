/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        // backend ของจริงไม่มีข้อมูล → mock empty array
        cy.intercept("GET", "**/api/repeated-transactions", {
            statusCode: 200,
            body: []
        }).as("getRepeated");

        cy.visit("/repeated");
        cy.wait("@getRepeated");
    });

    it("แสดงหัวข้อหน้าถูกต้อง", () => {
        cy.contains("ธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("แสดง empty state เมื่อไม่มีรายการซ้ำ", () => {
        cy.contains("ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ").should("exist");
    });

    it("สามารถกดปุ่มเพิ่มรายการซ้ำได้", () => {
        cy.get(".add-repeated-btn").should("exist").click();

        // ฟอร์มเพิ่มธุรกรรมโผล่
        cy.get("input[name='name']").should("exist");
        cy.contains("ยืนยัน").should("exist");
    });
});
