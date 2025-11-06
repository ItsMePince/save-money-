/// <reference types="cypress" />

function stubAccountsList(fixture = "accounts-list.json") {
    cy.intercept("GET", "**/api/accounts*", {
        statusCode: 200,
        fixture,
    }).as("getAccounts");
}

function stubCreateAccount(afterFixture = "accounts-after-create.json") {
    cy.intercept("POST", "**/api/accounts", (req) => {
        req.reply({
            statusCode: 201,
            body: {
                id: 999,
                ...req.body,
                message: "บันทึกเรียบร้อย ✅",
            },
        });
    }).as("createAccount");

    cy.intercept("GET", "**/api/accounts*", {
        statusCode: 200,
        fixture: afterFixture,
    }).as("getListAfterCreate");
}

describe("AccountNew Page — Create new account (no alert version)", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly("e2e");
        stubAccountsList();
        cy.visit("/accountnew");
        cy.get("input, select, button", { timeout: 10000 }).should("exist");
    });

    it("should render account creation form correctly", () => {
        cy.get("input[placeholder='ชื่อบัญชี']").should("be.visible");
        cy.contains("ประเภทบัญชี").should("exist");
        cy.contains("จำนวนเงิน").should("exist");
        cy.contains("ยืนยัน").should("exist");
    });

    it("should allow creating a new account successfully", () => {
        stubCreateAccount("accounts-after-create.json");

        cy.get("input[placeholder='ชื่อบัญชี']").clear().type("บัญชีออมทรัพย์ทดสอบ");
        cy.contains("ประเภทบัญชี").parent().find("button.select").click();
        cy.contains("button.opt", "ธนาคาร").click();
        cy.get(".icon-chip").first().click();
        cy.get("input[aria-label='จำนวนเงิน']").clear().type("5000");

        cy.contains("button", "ยืนยัน").click({ force: true });

        cy.wait("@createAccount").its("response.statusCode").should("eq", 201);
        cy.wait("@getListAfterCreate");
        cy.contains("บัญชีออมทรัพย์ทดสอบ").should("be.visible");
    });

    it("should handle validation properly when missing fields", () => {
        cy.contains("button", "ยืนยัน").click({ force: true });
        cy.location("pathname").should("eq", "/accountnew");
        cy.get("input[placeholder='ชื่อบัญชี']").should("have.value", "");
    });
});
