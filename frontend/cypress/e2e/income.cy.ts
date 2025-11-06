// cypress/e2e/income.cy.ts
/// <reference types="cypress" />
describe('Income Page - User can record a new income entry', () => {

    const testAmount = '1234.56';
    const testNote = 'เงินเดือนเดือนล่าสุด';
    const testPlace = 'บริษัท A';
    const paymentMethodName = 'ธนาคารกสิกร';

    beforeEach(() => {
        // --- 1. ล็อกอิน (เหมือนเดิม) ---
        cy.visit('/login');
        cy.get('input[placeholder="username"]').type('admin');
        cy.get('input[type="password"]').type('admin');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
        cy.url().should('include', '/home');

        //
        // --- 2. ⭐️⭐️⭐️ ตั้งค่า Mock Draft State (ส่วนที่แก้ไข) ⭐️⭐️⭐️ ---
        //
        cy.window().then((win) => {
            const draft = {
                // Mock Payment Method เพื่อให้ !payment?.name เป็น false
                payment: { name: paymentMethodName },
                // Mock Place เพื่อให้ !place.trim() เป็น false
                place: testPlace
            };

            // นี่คือ Key ที่ถูกต้องที่ Income.tsx ใช้ (DRAFT_KEY = "income_draft_v2")
            win.sessionStorage.setItem('income_draft_v2', JSON.stringify(draft));

            // ลบ key เก่าๆ ที่เราเคยใช้ทิ้งไป
            win.sessionStorage.removeItem('paymentMethod');
            win.sessionStorage.removeItem('edit_id_income');
        });

        // --- 3. ไปที่หน้า Income ---
        // (ตอนนี้ component จะโหลดพร้อมกับค่า 'place' และ 'payment' ทันที)
        cy.visit('/income');
    });

    //
    // --- (Test Body ที่ง่ายขึ้น) ---
    //
    it('should successfully record a new income entry', () => {
        // 1. ตรวจสอบว่าหน้าโหลดถูกต้อง
        cy.get('.type-pill .pill').should('contain', 'รายได้');

        // 2. เลือก Category
        cy.contains('button.cat', 'ค่าขนม').should('have.class', 'active');

        // 3. ป้อนจำนวนเงิน
        cy.get('.keypad button').contains('1').click();
        cy.get('.keypad button').contains('2').click();
        cy.get('.keypad button').contains('3').click();
        cy.get('.keypad button').contains('4').click();
        cy.get('.keypad button').contains('.').click();
        cy.get('.keypad button').contains('5').click();
        cy.get('.keypad button').contains('6').click();
        cy.get('.amount-input').should('have.value', testAmount);

        // 4. กรอก Note
        cy.get('.inputs input[placeholder="โน้ต"]').type(testNote);

        // 5. ⭐️ ตรวจสอบค่า 'สถานที่' ที่ Mock มา
        // (เราไม่ต้องคลิกไปมาอีกแล้ว เพราะค่kถูกอ่านจาก sessionStorage ตอนโหลด)
        cy.get('.inputs input[placeholder="สถานที่"]').should('have.value', testPlace);

        // 6. ⭐️ ตรวจสอบค่า 'Payment' ที่ Mock มา
        cy.get('.segments button.seg').contains(paymentMethodName).should('exist');

        // 7. Mock API call
        cy.intercept('POST', '**/api/expenses', {
            statusCode: 201,
            body: { id: 'mock-income-1', message: 'Success' },
        }).as('createIncome');

        // 8. คลิกปุ่มยืนยัน
        // (ตอนนี้ควรจะผ่าน check 'Required ❌' แล้ว)
        cy.on('window:alert', (text) => {
            expect(text).to.eq('บันทึกเรียบร้อย ✅');
        });
        cy.get('.confirm .ok-btn').click();

        // 9. ตรวจสอบการเรียก API และการนำทาง
        cy.wait('@createIncome');
        cy.url().should('include', '/summary');
    });
});