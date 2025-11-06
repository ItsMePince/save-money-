// accountselect.cy.ts

const BASE_URL = 'http://localhost:3000';

const mockAccounts = [
  { id: 1, name: 'SCB', amount: 50000, iconKey: 'bank', type: 'BANK' },
  { id: 2, name: 'กระเป๋าตัง', amount: 5000, iconKey: 'wallet', type: 'CASH' },
  { id: 3, name: 'Visa', amount: 100000, iconKey: 'credit', type: 'CREDIT_CARD' },
  { id: 4, name: 'Kbank', amount: 30000, iconKey: 'landmark', type: 'BANK' },
];

describe('AccountSelect Page', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/accounts', {
      statusCode: 200,
      body: mockAccounts
    }).as('getAccounts');

    cy.visit(BASE_URL + '/accountselect', {
      onBeforeLoad(win) {
        win.localStorage.setItem('isAuthenticated', 'true');
        win.localStorage.removeItem('accountFavs');
        win.localStorage.removeItem('pendingExpenseAmount');
      },
    });

    cy.wait('@getAccounts');
  });

  describe('การแสดงผล', () => {
    it('แสดงรายการบัญชีทั้งหมด', () => {
      cy.get('.card.mini').should('have.length', 4);
      cy.contains('.mini__title', 'SCB').should('be.visible');
      cy.contains('.mini__title', 'กระเป๋าตัง').should('be.visible');
      cy.contains('.mini__title', 'Visa').should('be.visible');
    });

    it('แสดงไอคอนของแต่ละบัญชี', () => {
      cy.get('.mini__icon').should('have.length', 4);
      cy.get('.mini__icon svg').should('exist');
    });

    it('แสดง "ไม่มีรายการ" เมื่อไม่มีข้อมูล', () => {
      cy.intercept('GET', '**/api/accounts', {
        statusCode: 200,
        body: []
      }).as('emptyAccounts');

      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
        },
      });

      cy.wait('@emptyAccounts');
      cy.contains('.empty', 'ไม่มีรายการ').should('be.visible');
    });
  });

  describe('Filter', () => {
    it('เปิด/ปิด dropdown filter', () => {
      cy.get('.filter__menu').should('not.exist');
      cy.get('.filter__button').click();
      cy.get('.filter__menu').should('be.visible');
      cy.get('.filter__button').click();
      cy.get('.filter__menu').should('not.exist');
    });

    it('กรองตามประเภท - ธนาคาร', () => {
      cy.get('.filter__button').click();
      cy.contains('.filter__option', 'ธนาคาร').click();
      cy.get('.card.mini').should('have.length', 2);
      cy.contains('.mini__title', 'SCB').should('be.visible');
      cy.contains('.mini__title', 'Kbank').should('be.visible');
    });

    it('กรองตามประเภท - เงินสด', () => {
      cy.get('.filter__button').click();
      cy.contains('.filter__option', 'เงินสด').click();
      cy.get('.card.mini').should('have.length', 1);
      cy.contains('.mini__title', 'กระเป๋าตัง').should('be.visible');
    });

    it('กรองตามประเภท - บัตรเครดิต', () => {
      cy.get('.filter__button').click();
      cy.contains('.filter__option', 'บัตรเครดิต').click();
      cy.get('.card.mini').should('have.length', 1);
      cy.contains('.mini__title', 'Visa').should('be.visible');
    });

    it('กลับมาแสดงทั้งหมด', () => {
      cy.get('.filter__button').click();
      cy.contains('.filter__option', 'เงินสด').click();
      cy.get('.card.mini').should('have.length', 1);

      cy.get('.filter__button').click();
      cy.contains('.filter__option', 'ทั้งหมด').click();
      cy.get('.card.mini').should('have.length', 4);
    });
  });

  describe('Favorite', () => {
    it('เพิ่มรายการโปรด', () => {
      cy.get('.card.mini').first().within(() => {
        cy.get('.star').should('have.class', 'off');
        cy.get('.star').click();
        cy.get('.star').should('have.class', 'on');
      });
    });

    it('ลบรายการโปรด', () => {
      cy.get('.card.mini').first().within(() => {
        cy.get('.star').click();
        cy.get('.star').should('have.class', 'on');
        cy.get('.star').click();
        cy.get('.star').should('have.class', 'off');
      });
    });

    it('รายการโปรดขึ้นก่อน', () => {
      // คลิก star ของ Visa
      cy.contains('.card.mini', 'Visa').within(() => {
        cy.get('.star').click();
      });

      // Visa ควรขึ้นมาเป็นอันดับแรก
      cy.get('.card.mini').first().should('contain', 'Visa');
    });

    it('บันทึก favorite ใน localStorage', () => {
      cy.contains('.card.mini', 'SCB').within(() => {
        cy.get('.star').click();
      });

      cy.window().then((win) => {
        const favs = JSON.parse(win.localStorage.getItem('accountFavs') || '{}');
        expect(favs['1']).to.exist;
        expect(favs['1'].favorite).to.be.true;
      });
    });

    it('โหลด favorite จาก localStorage', () => {
      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
          win.localStorage.setItem('accountFavs', JSON.stringify({
            '2': { favorite: true, favoritedAt: Date.now() }
          }));
        },
      });

      cy.wait('@getAccounts');
      cy.get('.card.mini').first().should('contain', 'กระเป๋าตัง');
      cy.get('.card.mini').first().within(() => {
        cy.get('.star').should('have.class', 'on');
      });
    });
  });

  describe('เลือกบัญชี', () => {
    it('เลือกบัญชีแล้ว navigate กลับ', () => {
      cy.contains('.mini__title', 'SCB').click();
      cy.url().should('not.include', '/accountselect');
    });

    it('คลิก star ไม่ trigger เลือกบัญชี', () => {
      cy.url().then((initialUrl) => {
        cy.get('.card.mini').first().within(() => {
          cy.get('.star').click();
        });
        cy.url().should('eq', initialUrl);
      });
    });
  });

  describe('ตรวจสอบยอดเงิน', () => {
    it('เลือกได้เมื่อเงินพอ', () => {
      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
          win.localStorage.setItem('pendingExpenseAmount', '30000');
        },
      });

      cy.wait('@getAccounts');
      cy.contains('.mini__title', 'SCB').click();
      cy.url().should('not.include', '/accountselect');
    });

    it('แสดง alert เมื่อเงินไม่พอ', () => {
      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
          win.localStorage.setItem('pendingExpenseAmount', '60000');
        },
      });

      const alertStub = cy.stub();
      cy.on('window:alert', alertStub);

      cy.wait('@getAccounts');
      cy.contains('.mini__title', 'SCB').click().then(() => {
        expect(alertStub).to.be.called;
      });
    });

    it('ไม่ navigate เมื่อเงินไม่พอ', () => {
      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
          win.localStorage.setItem('pendingExpenseAmount', '60000');
        },
      });

      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.wait('@getAccounts');
      cy.contains('.mini__title', 'SCB').click();
      cy.url().should('include', '/accountselect');
    });
  });

  describe('Error Handling', () => {
    it('แสดง empty state เมื่อ API ล้มเหลว', () => {
      cy.intercept('GET', '**/api/accounts', {
        statusCode: 500,
        body: 'Server Error'
      }).as('errorAccounts');

      cy.visit(BASE_URL + '/accountselect', {
        onBeforeLoad(win) {
          win.localStorage.setItem('isAuthenticated', 'true');
        },
      });

      cy.wait('@errorAccounts');
      cy.contains('.empty', 'ไม่มีรายการ').should('be.visible');
    });
  });
});