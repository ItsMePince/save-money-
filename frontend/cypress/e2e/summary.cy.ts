// summary.cy.ts

const BASE_URL = 'http://localhost:3000';

describe('Summary Page', () => {

  const mockExpense = {
    id: 1,
    category: 'กาแฟ',
    amount: 85,
    type: 'EXPENSE',
    date: '2024-11-05',
    paymentMethod: 'บัตรเครดิต',
    note: 'Starbucks',
    place: 'Central World',
    occurredAt: '2024-11-05T14:30:00'
  };

  const mockIncome = {
    id: 2,
    category: 'เงินเดือน',
    amount: 30000,
    type: 'INCOME',
    date: '2024-11-01',
    paymentMethod: 'โอน',
    occurredAt: '2024-11-01T09:00:00'
  };

  const mockRepeated = {
    id: 3,
    category: 'Netflix',
    amount: 419,
    type: 'EXPENSE',
    date: '2024-11-01',
    paymentMethod: 'บัตรเครดิต',
    note: '(ซ้ำ: รายเดือน)',
    occurredAt: '2024-11-01T00:00:00'
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/expenses*', {
      statusCode: 200,
      body: [mockExpense, mockIncome]
    }).as('getExpenses');

    cy.intercept('GET', '**/api/repeated-transactions*', {
      statusCode: 200,
      body: []
    }).as('getRepeated');

    cy.visit(BASE_URL + '/summary', {
      onBeforeLoad(win) {
        win.localStorage.setItem('isAuthenticated', 'true');
      },
    });

    cy.wait('@getExpenses');
  });

  it('แสดงรายการทั้งหมด', () => {
    cy.get('.day-card', { timeout: 10000 }).should('be.visible');
    cy.contains('กาแฟ').should('be.visible');
  });

  it('แสดงข้อความเมื่อไม่มีรายการ', () => {
    cy.intercept('GET', '**/api/expenses*', { body: [] }).as('getEmpty');
    cy.intercept('GET', '**/api/repeated-transactions*', { body: [] });
    cy.reload();
    cy.wait('@getEmpty');
    cy.contains('ไม่มีรายการ', { timeout: 10000 }).should('be.visible');
  });

  it('แสดง error เมื่อ API fail', () => {
    cy.intercept('GET', '**/api/expenses*', { statusCode: 500 }).as('getError');
    cy.reload();
    cy.wait('@getError');
    cy.get('.day-card.neg', { timeout: 10000 }).should('be.visible');
  });

  it('แยกสีรายรับ/รายจ่าย', () => {
    cy.get('.row-amt.neg').should('exist'); // expense (แดง)
    cy.get('.row-amt.pos').should('exist'); // income (เขียว)
  });

  it('แสดงยอดรวมต่อวัน', () => {
    cy.get('.day-total').should('contain.text', 'รวม:');
    cy.get('.day-total b').should('exist');
  });

  it('คลิกเปิด detail modal', () => {
    cy.contains('กาแฟ', { timeout: 10000 }).click();
    cy.get('.detail-overlay', { timeout: 5000 }).should('be.visible');
  });

  it('แสดงข้อมูลใน modal', () => {
    cy.contains('กาแฟ').click();
    cy.get('.detail-body', { timeout: 5000 }).within(() => {
      cy.contains('ค่าใช้จ่าย').should('be.visible');
      cy.contains('บัตรเครดิต').should('be.visible');
    });
  });

  it('ปิด modal ได้', () => {
    cy.contains('กาแฟ').click();
    cy.get('.detail-close', { timeout: 5000 }).click();
    cy.get('.detail-overlay').should('not.exist');
  });

  it('กดแก้ไข expense navigate ไป /expense-edit', () => {
    cy.contains('กาแฟ').click();
    cy.contains('button', 'แก้ไข', { timeout: 5000 }).click();
    cy.url({ timeout: 5000 }).should('include', '/expense-edit');
  });

  it('กดแก้ไข income navigate ไป /income-edit', () => {
    cy.contains('เงินเดือน').click();
    cy.contains('button', 'แก้ไข', { timeout: 5000 }).click();
    cy.url({ timeout: 5000 }).should('include', '/income-edit');
  });

  it('กดแก้ไข repeated transaction navigate ไป /repeated-transactions', () => {
    cy.intercept('GET', '**/api/expenses*', {
      statusCode: 200,
      body: [mockRepeated]
    }).as('getRepeatedData');
    cy.intercept('GET', '**/api/repeated-transactions*', { body: [] });
    cy.reload();
    cy.wait('@getRepeatedData');

    cy.contains('Netflix').click();
    cy.contains('button', 'แก้ไข', { timeout: 5000 }).click();
    cy.url({ timeout: 5000 }).should('include', '/repeated-transactions');
  });

  it('ลบรายการสำเร็จ', () => {
    cy.intercept('DELETE', '**/api/expenses/1', { statusCode: 200 }).as('delete');
    cy.intercept('GET', '**/api/expenses*', { body: [] }).as('afterDelete');
    cy.intercept('GET', '**/api/repeated-transactions*', { body: [] });

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    cy.contains('กาแฟ').click();
    cy.contains('button', 'ลบ', { timeout: 5000 }).click();

    cy.wait('@delete');
    cy.wait('@afterDelete');
    cy.contains('ไม่มีรายการ', { timeout: 10000 }).should('be.visible');
  });

  it('ลบ repeated transaction ใช้ API ถูกต้อง', () => {
    cy.intercept('GET', '**/api/expenses*', { body: [mockRepeated] }).as('getData');
    cy.intercept('DELETE', '**/api/repeated-transactions/3', { statusCode: 200 }).as('deleteRepeated');
    cy.intercept('GET', '**/api/repeated-transactions*', { body: [] });
    cy.reload();
    cy.wait('@getData');

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });

    cy.contains('Netflix').click();
    cy.contains('button', 'ลบ').click();

    cy.wait('@deleteRepeated').its('request.url').should('include', 'repeated-transactions');
  });

  it('ยกเลิกการลบ', () => {
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(false);
    });

    cy.contains('กาแฟ').click();
    cy.contains('button', 'ลบ').click();
    cy.get('.detail-overlay').should('be.visible');
  });
});