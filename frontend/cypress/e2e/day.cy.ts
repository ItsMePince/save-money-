// cypress/e2e/day.cy.ts
/// <reference types="cypress" />

function makeMonthDataForDay(yyyy: number, mm: number) {
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

const TARGET_DATE_ISO = '2025-11-03'; // YYYY-MM-DD
const TARGET_THAI = '03/11/2568';

const forceRechartsRender = () => {
    cy.window().then((win) => {
        if (!(win as any).ResizeObserver) {
            class RO {
                private cb: any;
                constructor(cb: any) { this.cb = cb; }
                observe() { this.cb?.([{ contentRect: { width: 900, height: 320 } }]); }
                unobserve() {}
                disconnect() {}
            }
            (win as any).ResizeObserver = RO as any;
        }
        win.dispatchEvent(new Event('resize'));
    });
};

// หา target สำหรับ trigger mousemove แบบยืดหยุ่น (รองรับทั้ง Pie/Area)
function getChartTarget() {
    return cy.document().then(($doc) => {
        const wrap = $doc.querySelector('.recharts-wrapper');
        if (wrap) return cy.get('.recharts-wrapper').first();

        const svg = $doc.querySelector('svg.recharts-surface');
        if (svg) return cy.get('svg.recharts-surface').first();

        // ถ้าไม่มีจริง ๆ ให้ fail แบบอ่านง่าย
        throw new Error('ไม่พบองค์ประกอบกราฟ (ทั้ง .recharts-wrapper และ svg.recharts-surface)');
    });
}

describe('Day Page - รายการและกราฟเรนเดอร์ถูกต้อง', () => {
    beforeEach(() => {
        cy.clock(new Date('2025-11-10T10:00:00.000Z').getTime(), ['Date']);
        cy.mockLoginFrontendOnly('admin');

        // อิง month.tsx: เรียก /api/expenses/range?start=YYYY-MM-01&end=YYYY-MM-31
        cy.intercept('GET', '**/api/expenses/range*', (req) => {
            const url = new URL(req.url);
            const start = url.searchParams.get('start');
            let yyyy: number, mm: number;
            if (start) {
                const [y, m] = start.split('-').map(Number);
                yyyy = y; mm = m;
            } else {
                const d = new Date();
                yyyy = d.getFullYear();
                mm = d.getMonth() + 1;
            }

            const base = makeMonthDataForDay(yyyy, mm);

            // เติมรายรับในวัน TARGET ให้หน้า Day มีทั้งเขียว/แดง
            const m2 = String(mm).padStart(2, '0');
            base.push({
                id: Number(`${yyyy}${m2}99`),
                type: 'INCOME',
                category: 'เงินพิเศษ',
                amount: 250,
                occurredAt: `${yyyy}-${m2}-03T15:00:00`,
            });

            req.reply({ statusCode: 200, body: base });
        }).as('getRange');

        cy.intercept('GET', '**/api/repeated-transactions*', {
            statusCode: 200,
            body: [],
        }).as('getRepeated');
    });

    it('เข้าหน้า /day?date=2025-11-03 แล้วเห็นลิสต์รายการของวัน + กราฟขึ้น', () => {
        cy.visit(`/day?date=${TARGET_DATE_ISO}`);
        cy.wait(['@getRange', '@getRepeated']);

        cy.get('.date-chip', { timeout: 8000 }).should('contain.text', TARGET_THAI);

        cy.get('.item').should('have.length.at.least', 1);
        cy.get('.item .name').contains(/อาหาร|เดินทาง|เงินพิเศษ/).should('exist');
        cy.contains(/\b100\b/).should('exist'); // expense
        cy.contains(/\b250\b/).should('exist'); // income

        forceRechartsRender();
        // เลื่อนให้เข้า viewport แล้วเช็คกราฟแบบยืดหยุ่น
        getChartTarget().scrollIntoView().then(($el) => {
            const rect = $el[0].getBoundingClientRect();
            expect(rect.width).to.be.greaterThan(0);
            expect(rect.height).to.be.greaterThan(0);
        });
        cy.get('svg.recharts-surface', { timeout: 8000 }).should('be.visible');
    });

    it('แสดงยอดรวมของวัน (income/expense) ตรงกับข้อมูล mock', () => {
        cy.visit(`/day?date=${TARGET_DATE_ISO}`);
        cy.wait(['@getRange', '@getRepeated']);
        forceRechartsRender();

        cy.contains(/\b250\b/).should('exist'); // income
        cy.contains(/\b100\b/).should('exist'); // expense
    });
});
