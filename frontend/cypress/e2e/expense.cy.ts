/// <reference types="cypress" />
// cypress/e2e/expense.cy.ts
// @ts-ignore

declare global {
    interface Window { Cypress?: any; }
}

describe('Expense Page - User can record a new expense entry', () => {
    const testAmount = '150.75';
    const testNote   = 'ค่ากาแฟและขนม'; // [FIX] ปิดการใช้งาน note ตามที่ผู้ใช้แจ้ง
    const testPlace  = 'ร้านกาแฟ Starbugs';

    // ---- helper: [REVERT] นำ Flow (ที่ "ไม่ simplified") กลับมา ----
    const pickPaymentViaAllThenFirst = () => {
        // เปิดหน้าเลือกบัญชีจากปุ่มขวามือใน segments
        cy.get('.segments .seg').eq(1).click();
        cy.location('pathname').should('include', '/accountselect');

        // 1) [FIX] คลิก "ปุ่ม Filter ทั้งหมด" (ที่อยู่ข้างบน)
        cy.contains('button', 'ทั้งหมด', { timeout: 10000 })
            .should('be.visible')
            .click({ force: true });

        // 2) [NEW STEP] รอ list refresh
        cy.wait(1000);

        // 3) [REVERT] คลิก "item ทั้งหมด" (ที่อยู่ข้างล่าง) (*** เอา "SKIP" ออก ***)
        cy.get('li, .card, .account, [role="option"], button') // [FIX] ขยาย Selector ให้รวม button
            .contains('ทั้งหมด') // หา "ทั้งหมด"
            .last() // เอาตัวล่าง (กันไปคลิก "ปุ่ม" ซ้ำ)
            .should('be.visible')
            .click({ force: true });

        // 4) [NEW STEP] รอ list refresh อีกครั้ง
        cy.wait(1000);

        // 5) [FIX] คลิก "บัญชีแรก" (bank1) ที่โผล่มา
        cy.get('li, .card, .account, [role="option"]') // [FIX] เอา button ออก (กันไปคลิก Logout)
            .filter(':not(:contains("ทั้งหมด"))') // กรอง "ทั้งหมด" (item) ออก
            .first() // เอาตัวแรกที่เหลือ (ควรเป็น bank1)
            .should('be.visible')
            .click({ force: true });

        // 6) [FIX] Flow นี้ "ควรจะ" เด้งกลับเอง (ตามวิดีโอ 105222.mp4) -> "รอ" (ไม่ใช้ cy.go('back'))
        cy.location('pathname', { timeout: 10000 }).should('eq', '/expense'); // [FIX] รอเด้งกลับ

        // 7) [FIX] (*** ปิดการตรวจสอบ state ตามที่ผู้ใช้สั่ง ***)
        // cy.get('.segments .seg', { timeout: 5000 }).eq(1).then(($seg) => {
        //   const buttonText = $seg.text().trim();
        //   expect(buttonText).to.not.equal('ประเภทชำระเงิน'); // [FIX] เช็กว่า "bank1"
        // });
    };

    beforeEach(() => {
        // 1) Login
        cy.visit('/login');
        cy.get('input[placeholder="username"]').type('admin');
        cy.get('input[type="password"]').type('admin');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/home');

        // 2) เตรียมค่าให้หน้า Expense ใช้ (Longdo: selectedPlaceName)
        cy.window().then((win) => {
            win.sessionStorage.setItem('selectedPlaceName', testPlace);
            win.sessionStorage.removeItem('edit_id_expense');
            // ไม่ลบ expense_draft_v2/paymentMethod เพื่อเผื่อหน้าตั้งเอง
        });

        // 3) เข้า /expense และกระตุ้น focus ให้ apply() ทำงาน
        cy.visit('/expense');
        cy.window().then((win) => win.dispatchEvent(new Event('focus')));
    });

    it('should successfully record a new expense', () => {
        // หน้า & หมวด
        cy.get('.type-pill .pill').should('contain', 'ค่าใช้จ่าย');
        cy.contains('button.cat', 'อาหาร').should('have.class', 'active');

        // ใส่จำนวนเงินผ่าน keypad
        '150.75'.split('').forEach((ch) => {
            cy.get('.keypad button').contains(ch).click();
        });
        cy.get('.amount-input').should('have.value', testAmount);

        // [FIX] ใส่โน้ต (Optional - ปิดไป)
        // cy.get('.inputs input[placeholder="โน้ต"]').type(testNote);

        // ตรวจ “สถานที่” (readonly + เติมจาก selectedPlaceName)
        cy.get('.inputs input[placeholder="สถานที่"]', { timeout: 6000 }).should(($input) => {
            expect($input).to.have.attr('readonly');
            expect($input).to.have.value(testPlace);
        });

        // ✅ เลือกบัญชีโดย "กดปุ่ม ทั้งหมด" ก่อน แล้วแตะตัวเลือกแรก
        pickPaymentViaAllThenFirst();

        // ---- Mock API + ตรวจ payload คร่าว ๆ ----
        cy.intercept('POST', '**/api/expenses', (req) => {
            expect(req.body).to.have.property('type', 'EXPENSE');
            expect(Number(req.body.amount)).to.be.greaterThan(0);
            expect(req.body).to.have.property('place', testPlace);
            req.reply({ statusCode: 201, body: { id: 'mock-expense-1', message: 'Success' } });
        }).as('createExpense');

        // ---- [FIX] ดัก alert ด้วย stub (ตามภาพ S__181395473.jpg) ----
        const alertStub = cy.stub().as('alert');
        cy.on('window:alert', alertStub);

        // กดบันทึก [FIX] แก้ Selector ให้เป็นปุ่มติ๊กถูก (เจาะจง)
        cy.get('.keypad + .confirm button', { timeout: 10000 }).click(); // [FIX] (ไม่ใช่ .ok-btn)

        // [FIX] ตรวจสอบ window:alert (ไม่ใช่ Custom Modal)
        cy.get('@alert').should('have.been.calledOnce');
        cy.get('@alert').then((stub: any) => {
            const msg = String(stub.getCall(0).args[0] ?? '').replace(/\s+/g, ' ').trim();
            expect(msg).to.match(/บันทึกเรียบร้อย/); // [FIX] เช็กข้อความจาก alert
            expect(msg).not.to.match(/Required/);
        });

        // [FIX] ลบการคลิก OK บน Custom Modal (เพราะมันคือ alert)
        // cy.contains('button', 'OK').click();

        // รอ API + Redirect
        cy.wait('@createExpense');
        cy.url().should('include', '/summary');
    });
});