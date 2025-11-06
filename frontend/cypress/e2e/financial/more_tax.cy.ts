/// <reference types="cypress" />

describe('Tax Wizard - Calculate (2 Scenarios, auto-login)', () => {
    beforeEach(() => {
        cy.viewport(1280, 900);

        cy.visit('/tax').then(() => {
            cy.url().then((url) => {
                if (url.includes('/login')) {
                    cy.mockLoginFrontendOnly('admin');
                    cy.visit('/tax');
                }
            });
        });
    });

    const typeMoney = (name: string, value: number) => {
        cy.get(`input[name="${name}"]`, { timeout: 8000 })
            .should('exist')
            .clear()
            .type(value.toString());
    };

    const fillAllSteps = (income: number, withheld: number) => {
        // --- Income ---
        typeMoney('salaryPerMonth', income);
        typeMoney('bonusPerYear', 0);
        typeMoney('otherIncomePerYear', 0);
        cy.contains('button', 'ถัดไป').click();

        // --- Family ---
        cy.contains('button', 'ถัดไป').click();

        // --- Fund ---
        typeMoney('pvdPerYear', 0);
        typeMoney('socialSecurityPerYear', 9000);
        typeMoney('mortgageInterestPerYear', 0);
        cy.contains('button', 'ถัดไป').click();

        // --- Insurance ---
        typeMoney('lifeIns', 0);
        typeMoney('healthIns', 0);
        typeMoney('parentHealthIns', 0);
        typeMoney('annuityLifeIns', 0);
        cy.contains('button', 'ถัดไป').click();

        // --- Other Funds ---
        typeMoney('gpfPerYear', 0);
        typeMoney('nsoPerYear', 12000);
        typeMoney('teacherFundPerYear', 0);
        cy.contains('button', 'ถัดไป').click();

        // --- Donation ---
        typeMoney('donationGeneral', 0);
        typeMoney('donationEducation', 0);
        typeMoney('donationPolitical', 0);
        cy.contains('button', 'ถัดไป').click();

        // --- Withheld ---
        typeMoney('withheldSalaryPerYear', withheld);
        typeMoney('advancedTaxPaid', 0);
        cy.contains('button', 'คำนวณ').click();

        // --- Summary ---
        cy.get('.sum-row--final .sum-value', { timeout: 10000 }).should('exist');
    };

    it('Case 1: ไม่เสียภาษี (รายได้ต่ำ)', () => {
        fillAllSteps(10000, 0); // รายได้ต่อเดือนต่ำ
        cy.get('.sum-row--final .sum-value').invoke('text').then((txt) => {
            const n = parseFloat(txt.replace(/[^\d\-\.]/g, ''));
            expect(n).to.be.at.most(0);
        });
    });

    it('Case 2: เสียภาษี (รายได้สูง)', () => {
        fillAllSteps(100000, 0); // รายได้สูง
        cy.get('.sum-row--final .sum-value').invoke('text').then((txt) => {
            const n = parseFloat(txt.replace(/[^\d\-\.]/g, ''));
            expect(n).to.be.greaterThan(0);
        });
    });
});
