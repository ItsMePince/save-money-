// cypress/e2e/more.cy.ts
describe("More Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly();

        // หน้า More ใช้ load accounts ก่อนเสมอ
        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    name: "บัญชีหลัก",
                    amount: 5000,
                    iconKey: "bank"
                }
            ]
        }).as("acc");

        cy.visit("/more");
    });

    it("renders More page", () => {
        cy.wait("@acc");

        // เช็คหัวข้อหลัก
        cy.contains("รายการเพิ่มเติม").should("exist");

        // เช็ค 3 เมนูจริงที่เห็นบน UI
        cy.contains("ธุรกรรมที่เกิดซ้ำ").should("exist");
        cy.contains("คำนวณภาษีลดหย่อน").should("exist");
        cy.contains("Export CSV").should("exist");
    });
});
