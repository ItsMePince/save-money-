/// <reference types="cypress" />
describe('Custom Income Page - User can create a new income category', () => {

    beforeEach(() => {
        cy.visit('/login');
        cy.get('input[placeholder="username"]').type('admin');
        cy.get('input[type="password"]').type('admin');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/home');

        // ไปหน้า Custom Income โดยตรง
        cy.visit('/customincome');
    });

    /**
     * ✅ Test 1: Happy Path
     */
    it('should allow creating a new custom income category and navigate back', () => {
        const customName = 'เงินเดือนพิเศษ';

        // ตรวจสอบว่าเป็นหน้า Custom Income
        cy.get('.cc-title').should('contain', 'Custom Income');

        // เลือกไอคอน เช่น 'เหรียญ' (Coins)
        cy.get('button[title="ดอกเบี้ย"]').click(); // ใช้ label จาก ICON_SETS_INCOME
        cy.get('.cc-picked').find('svg').should('be.visible');

        // พิมพ์ชื่อหมวดรายได้
        cy.get('input[placeholder="ชื่อหมวดรายได้"]').type(customName);

        // กดยืนยัน
        cy.get('.cc-confirm').click();

        // ต้องกลับไปหน้า /income
        cy.url().should('include', '/income');
    });

    /**
     * ✅ Test 2: Sad Path
     */
    it('should show alert if user clicks confirm without selecting icon or name', () => {
        // สร้าง spy ดัก alert
        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alertStub');
        });

        // กดปุ่มยืนยันโดยไม่เลือกอะไร
        cy.get('.cc-confirm').click();

        cy.get('@alertStub').should(
            'have.been.calledWith',
            'กรุณาเลือกไอคอนและตั้งชื่อ'
        );
    });

    /**
     * ✅ Test 3: Search Functionality
     */
    it('should filter icons based on search query', () => {
        const searchQuery = 'ฟรีแลนซ์';

        cy.wait(800);

        // ตรวจสอบว่ากลุ่มอื่น ๆ มีอยู่ก่อน
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('exist');
        cy.get('button[title="เงินเดือน"]').should('exist');

        // พิมพ์ค้นหา
        cy.get('.cc-search-input').type(searchQuery);

        // ผลลัพธ์ควรเหลือเฉพาะที่ตรงกับคำค้น
        cy.contains('h3', 'งานเสริม & ฟรีแลนซ์').should('exist');
        cy.get('button[title="ฟรีแลนซ์"]').should('exist');
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('not.exist');

        // ล้างคำค้นหา
        cy.get('.cc-search-clear').click();
        cy.get('.cc-search-input').should('have.value', '');
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('exist');
    });

});
