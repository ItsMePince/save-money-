describe("Login Component", () => {

    beforeEach(() => {
        cy.window().invoke("sessionStorage.clear");

        cy.intercept("GET", "**/api/accounts", { statusCode: 200, body: [] }).as("acc");
        cy.intercept("GET", "**/api/expenses*", { statusCode: 200, body: [] }).as("exp");
        cy.intercept("GET", "**/api/repeated-transactions", { statusCode: 200, body: [] }).as("rep");

        cy.visit("/login");
    });

    it("login success and redirect to /home", () => {
        cy.intercept("POST", "**/auth/login", {
            statusCode: 200,
            body: {
                success: true,
                user: { id: 1, username: "admin", role: "USER" }
            }
        }).as("loginOK");

        cy.get('input[autoComplete="username"]').type("admin");
        cy.get('input[autoComplete="current-password"]').type("password123");
        cy.get("form").submit();

        cy.wait("@loginOK");

        cy.mockLoginFrontendOnly();

        cy.url().should("include", "/home");
    });

    it("wrong password shows error", () => {
        cy.intercept("POST", "**/auth/login", {
            statusCode: 400,
            body: { success: false, message: "รหัสผ่านไม่ถูกต้อง" }
        }).as("wrongPw");

        cy.get('input[autoComplete="username"]').type("admin");
        cy.get('input[autoComplete="current-password"]').type("wrongpassword");
        cy.get("form").submit();

        cy.wait("@wrongPw");

        cy.get('[data-testid="login-error"]')
            .should("be.visible")
            .and("contain.text", "รหัสผ่านไม่ถูกต้อง");

        cy.url().should("include", "/login");
    });

    it("network error shows generic error", () => {
        cy.intercept("POST", "**/auth/login", {
            forceNetworkError: true
        }).as("netErr");

        cy.get('input[autoComplete="username"]').type("admin");
        cy.get('input[autoComplete="current-password"]').type("password123");
        cy.get("form").submit();

        cy.wait("@netErr");

        cy.get('[data-testid="login-error"]')
            .should("be.visible")
            .and("contain.text", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");

        cy.url().should("include", "/login");
    });
});
