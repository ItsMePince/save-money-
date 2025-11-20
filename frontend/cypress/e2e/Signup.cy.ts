/// <reference types="cypress" />

describe("Signup Component", () => {
    beforeEach(() => {
        cy.window().invoke("sessionStorage.clear");
        cy.visit("/signup");
    });

    it("signup success → redirect to /Home (mocked session)", () => {
        cy.intercept("POST", "**/auth/signup", {
            statusCode: 200,
            body: {
                success: true,
                user: {
                    username: "newuser",
                    email: "new@example.com",
                    role: "USER"
                }
            }
        }).as("signupOK");

        cy.get("#email").type("new@example.com");
        cy.get("#username").type("newuser");
        cy.get("#password").type("123456");

        cy.get("form").submit();

        cy.wait("@signupOK");

        cy.window().then(win => {
            win.sessionStorage.setItem("isAuthenticated", "true");
            win.sessionStorage.setItem(
                "user",
                JSON.stringify({
                    username: "newuser",
                    email: "new@example.com",
                    role: "USER",
                })
            );
        });

        cy.visit("/home");

        cy.url().should("include", "/home");
    });

    it("signup fails → backend error", () => {
        cy.intercept("POST", "**/auth/signup", {
            statusCode: 400,
            body: {
                success: false,
                message: "อีเมลนี้ถูกใช้ไปแล้ว"
            }
        }).as("signupFail");

        cy.get("#email").type("used@example.com");
        cy.get("#username").type("someone");
        cy.get("#password").type("123456");

        cy.get("form").submit();

        cy.wait("@signupFail");

        cy.contains("อีเมลนี้ถูกใช้ไปแล้ว").should("be.visible");
        cy.url().should("include", "/signup");
    });

    it("network error → generic error", () => {
        cy.intercept("POST", "**/auth/signup", {
            forceNetworkError: true
        }).as("signupNet");

        cy.get("#email").type("new@example.com");
        cy.get("#username").type("newuser");
        cy.get("#password").type("123456");
        cy.get("form").submit();

        cy.wait("@signupNet");

        cy.contains("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้").should("be.visible");
        cy.url().should("include", "/signup");
    });
});
