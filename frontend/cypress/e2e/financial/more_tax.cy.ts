// cypress/e2e/tax.cy.ts
/// <reference types="cypress" />

const visitWithAutoLogin = (path = '/tax') => {
    cy.visit(path).then(() => {
        cy.url().then((url) => {
            if (url.includes('/login')) {
                cy.mockLoginFrontendOnly('admin');
                cy.visit(path);
            }
        });
    });
    cy.get('.tax-modal', { timeout: 10000 }).should('exist');
};

const next = () => cy.get('.footer-nav .btn-next:enabled', { timeout: 8000 }).first().click({ force: true });
const back = () => cy.get('.footer-nav .btn-back:enabled', { timeout: 8000 }).first().click({ force: true });

const typeMoney = (name: string, value: number | string) => {
    cy.get(`input[name="${name}"]`, { timeout: 8000 }).should('exist').clear().type(String(value));
};

const readNetTax = () =>
    cy.get('.sum-row--final .sum-value', { timeout: 10000 })
        .should('exist')
        .invoke('text')
        .then((txt) => Number(txt.replace(/[^\d.-]/g, '')));

const fillWizardQuick = (opts: { salaryPerMonth: number; withheld: number }) => {
    // Step 1: Income
    typeMoney('salaryPerMonth', opts.salaryPerMonth);
    typeMoney('bonusPerYear', 0);
    typeMoney('otherIncomePerYear', 0);
    next();

    // Step 2: Family
    next();

    // Step 3: Fund
    typeMoney('pvdPerYear', 0);
    typeMoney('socialSecurityPerYear', 9000);
    typeMoney('mortgageInterestPerYear', 0);
    next();

    // Step 4: Insurance
    typeMoney('lifeIns', 0);
    typeMoney('healthIns', 0);
    typeMoney('parentHealthIns', 0);
    typeMoney('annuityLifeIns', 0);
    next();

    // Step 5: Other Funds
    typeMoney('gpfPerYear', 0);
    typeMoney('nsoPerYear', 12000);
    typeMoney('teacherFundPerYear', 0);
    next();

    // Step 6: Donation
    typeMoney('donationGeneral', 0);
    typeMoney('donationEducation', 0);
    typeMoney('donationPolitical', 0);
    next();

    // Step 7: Withheld (กด next = คำนวณ)
    typeMoney('withheldSalaryPerYear', opts.withheld);
    typeMoney('advancedTaxPaid', 0);
    next(); // ใน WithheldStep ปุ่ม next จะเป็นการคำนวณแล้วไป Summary

    // Step 8: Summary พร้อมแล้ว
    cy.get('.sum-row--final .sum-value', { timeout: 10000 }).should('exist');
};

describe('Tax Wizard - Essential E2E', () => {
    beforeEach(() => {
        cy.viewport(1280, 900);
        visitWithAutoLogin('/tax');
    });

    it('Case 1: ไม่เสียภาษี (รายได้ต่ำ', () => {
        fillWizardQuick({ salaryPerMonth: 10000, withheld: 0 });
        readNetTax().then((n) => {
            expect(n).to.be.at.most(0);
        });
    });

    it('Case 2: เสียภาษี (รายได้สูง)', () => {
        fillWizardQuick({ salaryPerMonth: 100000, withheld: 0 });
        readNetTax().then((n) => {
            expect(n).to.be.greaterThan(0);
        });
    });

    it('ปิด module แล้วกลับมาใหม่ต้องเริ่มที่ Step 1 (เห็น input รายได้)', () => {
        // เปิดอยู่บนโมดัลแล้ว
        cy.get('.tax-close-btn').click();
        cy.url().should('include', '/more'); // จาก RouteTaxWizard
        visitWithAutoLogin('/tax');
        cy.get('input[name="salaryPerMonth"]').should('exist'); // เริ่มสเต็ป 1 แน่นอน
    });

    it('ค่าฟอร์มคงอยู่เมื่อย้อนกลับ (Income -> Family -> Back -> Income)', () => {
        // Income
        typeMoney('salaryPerMonth', 50000);
        next(); // ไป Family

        back(); // ย้อนกลับสู่ Income
        cy.get('input[name="salaryPerMonth"]').should(($inp) => {
            // AmountInput จะแสดงคอมมา
            expect(($inp.val() as string) || '').to.match(/50,?000/);
        });
    });
});
