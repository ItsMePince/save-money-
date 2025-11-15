// cypress/support/e2e.ts
import './commands';
import '@testing-library/cypress/add-commands';

beforeEach(() => {
    // ⭐ ใช้ session mock จาก commands.ts (ไม่ต้อง login จริง)
    cy.mockLoginFrontendOnly();

    // -------------------------------
    // ⭐ Mock data (ใช้เป็นค่าเดียวกันทุกหน้า)
    // -------------------------------
    const mockExpenses = [
        {
            id: 1,
            type: "EXPENSE",
            category: "อาหาร",
            amount: 150,
            note: "test",
            place: "BKK",
            occurredAt: "2025-01-05T08:00:00",
            paymentMethod: "CASH",
            iconKey: "food"
        }
    ];

    const mockAccounts = [
        {
            id: 1,
            name: "บัญชีหลัก",
            amount: 5000,
            iconKey: "bank"
        }
    ];

    const mockRepeated = [
        {
            id: 1,
            name: "Netflix",
            amount: 300,
            date: 15,
            type: "EXPENSE",
            iconKey: "netflix"
        }
    ];

    // -------------------------------
    // ⭐ FIX ตัวหลัก — intercept ครบทุก route ที่เว็บใช้จริง
    //    (นี่คือส่วนที่ทำให้ CI ผ่าน)
    // -------------------------------

    // Accounts
    cy.intercept("GET", "**/api/accounts*", mockAccounts).as("acc");

    // Expenses (หลายแบบตามหน้าเว็บ)
    cy.intercept("GET", "**/api/expenses", mockExpenses).as("expRoot");      // /api/expenses
    cy.intercept("GET", "**/api/expenses?date=*", mockExpenses).as("expDay"); // /api/expenses?date=
    cy.intercept("GET", "**/api/expenses/*", mockExpenses).as("expSub");      // /api/expenses/<anything>
    cy.intercept("GET", "**/api/expenses/range*", mockExpenses).as("range");  // /api/expenses/range?start=
    cy.intercept("GET", "**/api/expenses/all*", mockExpenses).as("expAll");   // /api/expenses/all (More page)

    // Repeated transactions
    cy.intercept("GET", "**/api/repeated-transactions*", mockRepeated).as("rep");

    // -------------------------------
    // ⭐ ป้องกันการ request จริงทั้งหมดระหว่างรัน CI
    // -------------------------------
    cy.intercept("POST", "**/api/**", { statusCode: 200, body: { ok: true } });
    cy.intercept("PUT", "**/api/**", { statusCode: 200, body: { ok: true } });
    cy.intercept("DELETE", "**/api/**", { statusCode: 200, body: { ok: true } });
});
