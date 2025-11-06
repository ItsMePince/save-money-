/// <reference types="cypress" />

function makeMonthData(yyyy: number, mm: number) {
    const m = String(mm).padStart(2, '0');
    return [
        {
            id: Number(`${yyyy}${m}01`),
            type: 'EXPENSE',
            category: 'อาหาร',
            amount: 100,
            occurredAt: `${yyyy}-${m}-03T12:00:00`,
        },
        {
            id: Number(`${yyyy}${m}02`),
            type: 'INCOME',
            category: 'เงินเดือน',
            amount: 300,
            occurredAt: `${yyyy}-${m}-10T09:00:00`,
        },
        {
            id: Number(`${yyyy}${m}03`),
            type: 'EXPENSE',
            category: 'เดินทาง',
            amount: 900,
            occurredAt: `${yyyy}-${m}-22T08:30:00`,
        },
    ];
}

function hoverChartAtDay(day: number) {
    const ratioX = (day - 1) / (31 - 1);
    cy.get('.chart-card .recharts-wrapper').first().then(($wrap) => {
        const rect = $wrap[0].getBoundingClientRect();
        const leftPad = 10 + 16;
        const x = rect.left + leftPad + ratioX * (rect.width - leftPad * 2);
        const y = rect.top + rect.height * 0.45;
        cy.wrap($wrap)
            .trigger('mouseenter', { clientX: x, clientY: y, force: true })
            .trigger('mouseover', { clientX: x, clientY: y, force: true })
            .trigger('mousemove', { clientX: x, clientY: y, force: true });
        cy.wait(50);
    });
}

function readTooltipNumberBaht(): Cypress.Chainable<number> {
    return cy
        .get('.recharts-tooltip-wrapper')
        .should(($w) => {
            const style = $w.attr('style') || '';
            expect(style).to.match(/visibility:\s*visible/i);
        })
        .then(() => {
            return cy.get('.recharts-default-tooltip').then(($tip) => {
                const text = ($tip.text() || '').replace(/\s+/g, ' ').trim();
                const match = text.match(/([\d,]+)\s*฿/g);
                if (!match?.length) throw new Error(`ไม่พบจำนวนเงินใน Tooltip: "${text}"`);
                const last = match[match.length - 1];
                const num = Number(last.replace(/[^\d]/g, ''));
                return num;
            });
        });
}

describe('การนำทางหน้าเดือน (Month Page Navigation) + กราฟรายจ่ายขึ้น', () => {
    beforeEach(() => {
        cy.clock(new Date('2025-11-05T10:00:00.000Z').getTime(), ['Date']);
        cy.mockLoginFrontendOnly('admin');

        cy.intercept('GET', '**/api/expenses/range*', (req) => {
            const url = new URL(req.url);
            const start = url.searchParams.get('start');
            let body: any[] = [];
            if (start) {
                const [y, m] = start.split('-').map(Number);
                body = makeMonthData(y, m);
            } else {
                const d = new Date();
                body = makeMonthData(d.getFullYear(), d.getMonth() + 1);
            }
            req.reply({ statusCode: 200, body });
        }).as('getRange');

        cy.intercept('GET', '**/api/repeated-transactions*', {
            statusCode: 200,
            body: [],
        }).as('getRepeated');

        cy.visit('/month');
    });

    it('ควรนำทาง เดือนก่อนหน้า/ถัดไป ในหน้า /month ได้ถูกต้อง', () => {
        cy.location('pathname').should('include', '/month');
        cy.wait('@getRange');
        cy.contains('พฤศจิกายน 2568', { timeout: 10000 }).should('be.visible');
        cy.get('button[aria-label="ก่อนหน้า"]').click();
        cy.wait('@getRange');
        cy.contains('ตุลาคม 2568').should('be.visible');
        cy.get('button[aria-label="ถัดไป"]').click();
        cy.wait('@getRange');
        cy.contains('พฤศจิกายน 2568').should('be.visible');
        cy.get('button[aria-label="ถัดไป"]').click();
        cy.wait('@getRange');
        cy.contains('ธันวาคม 2568').should('be.visible');
    });
});
