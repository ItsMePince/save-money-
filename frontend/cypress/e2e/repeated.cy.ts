// cypress/e2e/repeated.cy.ts
/// <reference types="cypress" />

type Tx = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
};

const PAGE_PATH = '/recurring';

function stubAccounts() {
    cy.intercept('GET', '**/api/accounts', {
        statusCode: 200,
        body: [
            { id: 1, name: 'K-Bank', amount: 10000 },
            { id: 2, name: 'SCB', amount: 5000 },
            { id: 3, name: 'Wallet', amount: 3000 },
        ],
    }).as('getAccounts');
}

function stubIndex(fixture = 'repeated.json') {
    cy.intercept('GET', '**/api/repeated-transactions*', {
        statusCode: 200,
        fixture,
    }).as('getList');
}

function stubCreate(afterFixture = 'repeated-after-create.json') {
    cy.intercept('POST', '**/api/repeated-transactions', (req) => {
        req.reply({ statusCode: 201, body: { id: 999, ...req.body } });
    }).as('createTx');

    cy.intercept('GET', '**/api/repeated-transactions*', {
        statusCode: 200,
        fixture: afterFixture,
    }).as('getListAfterCreate');
}

describe('Repeated Transactions', () => {
    beforeEach(() => {
        // ✅ mock login เฉพาะฝั่ง frontend
        cy.mockLoginFrontendOnly('e2e');

        // ✅ ติดตั้ง intercepts ทั้งหมดก่อน visit
        stubAccounts();
        stubIndex();
    });

    it('แสดงรายการเริ่มต้น', () => {
        // เข้าเพจหลังจาก stub พร้อมแล้ว
        cy.visit(PAGE_PATH);

        // รอให้ API ถูกเรียก (ถ้าไม่เกิดใน 5 วิจะ fail)
        cy.wait('@getList', { timeout: 10000 });

        // ตรวจสอบข้อมูลที่แสดง
        cy.contains('Netflix Subscription').should('be.visible');
        cy.contains('Gym Membership').should('be.visible');
    });

    it('เพิ่มรายการใหม่', () => {
        // ติดตั้ง stub สำหรับ create ก่อน visit
        stubCreate('repeated-after-create.json');

        cy.visit(PAGE_PATH);
        cy.wait('@getList', { timeout: 10000 });

        // คลิกปุ่มเพิ่ม
        cy.get('.add-btn').click();

        // รอให้ form โหลด
        cy.get('input').should('have.length.greaterThan', 0);
        cy.wait('@getAccounts');

        // กรอกข้อมูล
        cy.get('input').eq(0).clear().type('Spotify Family');
        cy.get('select').eq(0).select('K-Bank');
        cy.get('input[type="number"]').clear().type('199');

        cy.get('input[type="date"]')
            .invoke('val', '2025-11-10')
            .trigger('change', { force: true });

        cy.get('select').eq(1).select('ทุกเดือน');

        // บันทึก (scroll และ force click เพื่อป้องกัน bottom nav)
        cy.get('.submit-btn').scrollIntoView().click({ force: true });

        // รอให้ API สำเร็จ
        cy.wait('@createTx', { timeout: 10000 });
        cy.wait('@getListAfterCreate', { timeout: 10000 });

        // ตรวจสอบข้อมูลใหม่
        cy.contains('Spotify Family').should('be.visible');
    });
});