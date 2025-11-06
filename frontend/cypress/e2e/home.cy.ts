// home.cy.ts

const BASE_URL = 'http://localhost:3000';

function mockLogin() {
  cy.visit(BASE_URL, {
    onBeforeLoad(win) {
      win.localStorage.setItem('isAuthenticated', 'true');
      win.localStorage.setItem('user', JSON.stringify({ username: 'e2e', role: 'USER' }));
    },
  });
}

function stubApis() {
  // Accounts - ยอดเริ่มต้น
  cy.intercept('GET', '**/api/accounts', {
    statusCode: 200,
    body: [
      { id: 1, name: 'K-Bank', amount: 10000, iconKey: 'bank' },
      { id: 2, name: 'SCB', amount: 5000, iconKey: 'wallet' },
    ],
  }).as('getAccounts');

  // Latest transaction
  cy.intercept('GET', '**/api/expenses', {
    statusCode: 200,
    body: [
      {
        id: 1,
        type: 'EXPENSE',
        category: 'อาหาร',
        amount: 150,
        date: '2025-11-05',
        occurredAt: '2025-11-05T10:30:00',
        iconKey: 'Utensils'
      },
    ],
  }).as('getExpenses');

  // Repeated Transactions
  cy.intercept('GET', '**/api/repeated-transactions', {
    statusCode: 200,
    body: [],
  }).as('getRepeated');

  // Range - รายการเดือนปัจจุบัน
  cy.intercept('GET', '**/api/expenses/range*', {
    statusCode: 200,
    body: [
      { id: 1, type: 'EXPENSE', category: 'อาหาร', amount: 150, date: '2025-11-05' },
      { id: 2, type: 'INCOME', category: 'เงินเดือน', amount: 30000, date: '2025-11-01' },
    ],
  }).as('getRange');
}

describe('Home Page', () => {
  beforeEach(() => {
    stubApis();
    mockLogin();
    cy.wait(['@getAccounts', '@getExpenses', '@getRepeated']);
  });

  it('แสดงยอดเงินรวมถูกต้อง', () => {
    cy.get('.balance-label').contains('เงินรวม').should('be.visible');
    // totalAccounts (15000) + monthIncome (30000) - monthExpense (150) = 44,850
    cy.get('.balance-amount').should('contain', '44,850');
  });

  it('แสดงรายรับ-รายจ่ายของเดือน', () => {
    // รายได้
    cy.contains('.action-label', 'รายได้')
      .parent()
      .should('contain', '30,000');

    // ค่าใช้จ่าย
    cy.contains('.action-label', 'ค่าใช้จ่าย')
      .parent()
      .should('contain', '150');

    // คงเหลือ (29,850)
    cy.contains('.action-label', 'ทั้งหมด')
      .parent()
      .should('contain', '29,850');
  });

  it('แสดงบัญชีทั้งหมด', () => {
    cy.contains('.category-name', 'K-Bank').should('be.visible');
    cy.contains('.category-amount', '10,000').should('be.visible');
    cy.contains('.category-name', 'SCB').should('be.visible');
    cy.contains('.category-amount', '5,000').should('be.visible');
  });

  it('แสดงรายการล่าสุด', () => {
    cy.contains('.transaction-title', 'ล่าสุด').should('be.visible');
    cy.get('.transaction-item')
      .should('be.visible')
      .within(() => {
        cy.contains('อาหาร').should('be.visible');
        cy.contains('-150').should('be.visible');
      });
  });

  it('เปลี่ยนเดือน', () => {
    // คลิกเดือนถัดไป
    cy.get('.month-year-nav button').last().click();
    cy.wait('@getRange');

    // คลิกเดือนก่อนหน้า
    cy.get('.month-year-nav button').first().click();
    cy.wait('@getRange');
  });

  it('คลิกดูทั้งหมด', () => {
    cy.contains('a', 'ดูทั้งหมด').click();
    cy.url().should('include', '/summary');
  });

  it('คลิกเพิ่มบัญชีใหม่', () => {
    cy.get('.category-card').last().click();
    cy.url().should('include', '/accountnew');
  });

  it('เมนูแก้ไข/ลบบัญชี', () => {
    // เปิดเมนู
    cy.get('.category-card').first().find('.more-btn').click();
    cy.get('.more-menu').should('be.visible');

    // ตรวจสอบปุ่มแก้ไข
    cy.contains('.more-item', 'แก้ไข').should('be.visible');

    // ตรวจสอบปุ่มลบ
    cy.contains('.more-item', 'ลบ').should('be.visible');
  });
  // เพิ่มต่อจาก test เดิม

  describe('Home Page - Critical Tests', () => {
    beforeEach(() => {
      stubApis();
      mockLogin();
      cy.wait(['@getAccounts', '@getExpenses', '@getRepeated']);
    });

    it('ลบบัญชีสำเร็จ', () => {
      cy.intercept('DELETE', '**/api/accounts/1', { statusCode: 200 }).as('deleteAccount');

      cy.get('.category-card').first().find('.more-btn').click();
      cy.contains('.more-item', 'ลบ').click();
      cy.on('window:confirm', () => true);
      cy.wait('@deleteAccount');

      cy.contains('.category-name', 'K-Bank').should('not.exist');
    });

    it('แก้ไขบัญชี', () => {
      cy.get('.category-card').first().find('.more-btn').click();
      cy.contains('.more-item', 'แก้ไข').click();
      cy.url().should('include', '/accountnew');
    });

    it('ไม่มีรายการแสดงข้อความ', () => {
      cy.intercept('GET', '**/api/expenses', { body: [] });
      cy.intercept('GET', '**/api/repeated-transactions', { body: [] });
      cy.reload();

      cy.contains('ยังไม่มีรายการ').should('be.visible');
    });

    it('401 redirect ไป login', () => {
      cy.intercept('GET', '**/api/accounts', { statusCode: 401 });
      cy.reload();
      cy.url().should('include', '/login');
    });

    it('ปิดเมนูเมื่อคลิกที่อื่น', () => {
      cy.get('.category-card').first().find('.more-btn').click();
      cy.get('.more-menu').should('be.visible');
      cy.get('.balance-card').click();
      cy.get('.more-menu').should('not.exist');
    });
  });
});