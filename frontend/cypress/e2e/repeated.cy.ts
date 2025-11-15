/// <reference types="cypress" />

describe("Repeated Transactions Page", () => {
    const mockList = [
        {
            id: 1,
            name: "Netflix",
            account: "บัญชีหลัก",
            amount: 300,
            date: "15",
            frequency: "MONTHLY"
        },
        {
            id: 2,
            name: "Spotify",
            account: "บัญชีหลัก",
            amount: 129,
            date: "10",
            frequency: "MONTHLY"
        }
    ];

    beforeEach(() => {
        cy.mockLoginFrontendOnly("admin");

        cy.intercept("GET", "**/api/repeated-transactions", {
            statusCode: 200,
            body: mockList
        }).as("getRepeated");

        cy.visit("/repeated");
        cy.wait("@getRepeated");
    });

    it("แสดงรายการธุรกรรมซ้ำทั้งหมด", () => {
        cy.get(".transaction-card").should("have.length", mockList.length);

        cy.contains("Netflix").should("exist");
        cy.contains("Spotify").should("exist");

        cy.contains("300").should("exist");
        cy.contains("129").should("exist");
    });

    it("สามารถเปิดเมนูของรายการแต่ละอันได้", () => {
        cy.contains("Netflix")
            .parents(".transaction-card")
            .find(".menu-btn")
            .click();

        cy.get(".dropdown-menu")
            .should("be.visible")
            .and("contain.text", "แก้ไข")
            .and("contain.text", "ลบ");
    });

    it("สามารถกดแก้ไขแล้วเข้า AddTransaction แบบ pre-fill ได้", () => {
        cy.contains("Netflix")
            .parents(".transaction-card")
            .find(".menu-btn")
            .click();

        cy.contains("แก้ไข").click();

        cy.url().should("include", "/repeated"); // ยังอยู่หน้าเดิม แต่เปลี่ยนเป็น form

        cy.get("input[name='name']").should("have.value", "Netflix");
        cy.get("input[name='amount']").should("have.value", "300");
        cy.get("input[name='date']").should("have.value", "15");
    });

    it("สามารถลบรายการได้", () => {
        cy.intercept("DELETE", "**/api/repeated-transactions/1", {
            statusCode: 204
        }).as("deleteTx");

        cy.contains("Netflix")
            .parents(".transaction-card")
            .find(".menu-btn")
            .click();

        cy.on("window:confirm", () => true);

        cy.contains("ลบ").click();

        cy.wait("@deleteTx");

        cy.get(".transaction-card").should("have.length", 1); // Spotify เหลืออย่างเดียว
        cy.contains("Netflix").should("not.exist");
    });

    it("กดปุ่ม + แล้วแสดงฟอร์มเพิ่มธุรกรรม", () => {
        cy.get(".add-btn").click();

        cy.get("form").should("exist");
        cy.get("input[name='name']").should("exist");
        cy.get("button").contains("บันทึก").should("be.visible");
    });
});
