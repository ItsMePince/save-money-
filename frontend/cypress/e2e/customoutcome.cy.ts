/// <reference types="cypress" />

describe('Custom Outcome Page - ผู้ใช้สามารถสร้างหมวดรายจ่ายใหม่', () => {

    beforeEach(() => {
        // --- (1) ล็อกอินก่อนทุกครั้ง ---
        cy.visit('/login');
        cy.get('input[placeholder="username"]').type('admin');
        cy.get('input[type="password"]').type('admin');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/home');

        // --- (2) สร้าง history stack ที่ถูกต้อง ---
        // ไปหน้า Expense ก่อน แล้วค่อยเปิด CustomOutcome
        cy.visit('/expense');
        cy.url().should('include', '/expense');
        cy.visit('/customoutcome');
        cy.url().should('include', '/customoutcome');
    });

    /**
     * ✅ Test 1: Happy Path
     * เลือกไอคอน ตั้งชื่อ แล้วกลับไปหน้า /expense
     */
    it('should allow creating a new custom outcome category and navigate back', () => {
        const customName = 'ของใช้ในบ้าน';

        // ตรวจว่าเป็นหน้า OutcomeCustom
        cy.get('.cc-title').should('contain', 'OutcomeCustom');

        // เลือกไอคอน เช่น "เหรียญ" (ในกลุ่ม งาน & การเงิน)
        cy.get('button[title="เหรียญ"]').click();

        // ตรวจว่าเลือกไอคอนได้จริง (ไอคอน '?' หายไป)
        cy.get('.cc-picked').find('span').should('not.exist');
        cy.get('.cc-picked').find('svg').should('be.visible');

        // ใส่ชื่อหมวดหมู่
        cy.get('input[placeholder="ชื่อหมวดหมู่"]').type(customName);

        // กดยืนยัน
        cy.get('.cc-confirm').click();

        // ✅ ต้องย้อนกลับมาที่ /expense (จาก nav(-1))
        cy.url().should('include', '/expense');
    });

    /**
     * ✅ Test 2: Validation
     * หากยังไม่ได้เลือกไอคอนหรือชื่อ ต้องขึ้น alert
     */
    it('should alert when confirming without selecting icon or name', () => {
        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alertStub');
        });

        // ไม่เลือกอะไร กดยืนยัน
        cy.get('.cc-confirm').click();
        cy.get('@alertStub').should(
            'have.been.calledWith',
            'กรุณาเลือกไอคอนและตั้งชื่อ'
        );

        // เลือกไอคอนแต่ไม่ใส่ชื่อ
        cy.get('button[title="กาแฟ"]').click();
        cy.get('.cc-confirm').click();
        cy.get('@alertStub').should('have.been.calledTwice');
    });

    /**
     * ✅ Test 3: Search Functionality
     * การค้นหาต้องกรองผลลัพธ์ถูกต้อง
     */
    it('should filter icons correctly when searching', () => {
        const searchQuery = 'งาน';

        cy.wait(1000); // รอให้โหลด icons

        // ก่อนค้นหา: กลุ่ม “อาหาร & เครื่องดื่ม” ต้องอยู่
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('exist');
        cy.get('button[title="กาแฟ"]').should('exist');

        // ค้นหา “งาน”
        cy.get('.cc-search-input').type(searchQuery);

        // ควรแสดงเฉพาะกลุ่มที่ตรง
        cy.contains('h3', 'งาน & การเงิน').should('exist');
        cy.get('button[title="งาน"]').should('exist');
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('not.exist');

        // ล้างคำค้นหา
        cy.get('.cc-search-clear').click();

        // ต้องกลับมาเหมือนเดิม
        cy.get('.cc-search-input').should('have.value', '');
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('exist');
        cy.get('button[title="กาแฟ"]').should('exist');
    });

});
