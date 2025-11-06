/// <reference types="cypress" />

function uiLoginIfNeeded() {
    cy.location('pathname', { timeout: 10000 }).then((path) => {
        if (!path.includes('/login')) return;
        cy.get(
            [
                'input[type="text"]',
                'input[name="username"]',
                'input#username',
                'input[autocomplete="username"]',
                'input[placeholder*="user"]',
                'input[placeholder*="ชื่อผู้ใช้"]',
                'input[type="email"]',
            ].join(', ')
        )
            .filter(':visible')
            .first()
            .clear()
            .type('admin');

        cy.get(
            [
                'input[type="password"]',
                'input[name="password"]',
                'input#password',
                'input[autocomplete="current-password"]',
                'input[placeholder*="pass"]',
                'input[placeholder*="รหัสผ่าน"]',
            ].join(', ')
        )
            .filter(':visible')
            .first()
            .clear()
            .type('admin');

        cy.contains('button, [type="submit"]', /login|เข้าสู่ระบบ/i)
            .filter(':visible')
            .first()
            .click();

        cy.location('pathname', { timeout: 10000 }).should('include', '/home');
    });
}

function goNextUntilDateChip(targetThaiDate: string, maxSteps = 40) {
    const step = (left: number) => {
        if (left <= 0) throw new Error(`ไม่พบวันที่ ${targetThaiDate} ภายใน ${maxSteps} ครั้ง`);
        cy.get('.date-chip').invoke('text').then((txt) => {
            const t = String(txt || '').replace(/\s+/g, ' ').trim();
            if (t.includes(targetThaiDate)) return;
            cy.get('button.nav-btn[aria-label="ถัดไป"]').click({ force: true });
            cy.wait(120);
            step(left - 1);
        });
    };
    step(maxSteps);
}

function readPiePercentToAlias(aliasName: string) {
    cy.get('svg.recharts-surface')
        .first()
        .within(() => {
            cy.get('.recharts-pie-labels text')
                .first()
                .then(($t) => {
                    const v = ($t.text() || '').trim();
                    cy.wrap(v || '100%').as(aliasName);
                });
        });
}

describe('การนำทางหน้าเดือน (Month Page Navigation)', () => {

    beforeEach(() => {
        cy.clock(new Date('2025-11-05T10:00:00.000Z').getTime(), ['Date']);

        cy.intercept('GET', '**/api/expenses/range*').as('getRange');
        cy.intercept('GET', '**/api/repeated-transactions*', {
            statusCode: 200,
            body: [],
        }).as('getRepeated');

        cy.visit('http://localhost:3000/login');
        uiLoginIfNeeded();
    });

    it('ควรนำทาง เดือนก่อนหน้า/ถัดไป ในหน้า /month ได้ถูกต้อง', () => {
        cy.get('a.nav-button[href="/month"]').filter(':visible').last().click({ force: true });
        cy.location('pathname').should('include', '/month');

        cy.wait('@getRange');

        cy.contains('พฤศจิกายน 2568', { timeout: 10000 })
            .should('be.visible');

        cy.get('button[aria-label="ก่อนหน้า"]').click();
        cy.wait('@getRange');

        cy.contains('ตุลาคม 2568')
            .should('be.visible');

        cy.get('button[aria-label="ถัดไป"]').click();
        cy.wait('@getRange');
        cy.contains('พฤศจิกายน 2568')
            .should('be.visible');

        cy.get('button[aria-label="ถัดไป"]').click();
        cy.wait('@getRange');

        cy.contains('ธันวาคม 2568')
            .should('be.visible');
    });
});