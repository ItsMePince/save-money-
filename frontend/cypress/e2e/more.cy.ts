// cypress/e2e/more.cy.ts
/// <reference types="cypress" />

describe('More Page', () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly('e2e')
        cy.visit('/more')
    })

    it('แสดงหน้า More ครบถ้วน', () => {
        cy.contains('รายการเพิ่มเติม').should('be.visible')
        cy.contains('ธุรกรรมที่เกิดซ้ำ').should('be.visible')
        cy.contains('คำนวณภาษีลดหย่อน').should('be.visible')
        cy.contains('Export CSV').should('be.visible')
    })

    it('คลิกธุรกรรมที่เกิดซ้ำ navigate ไป /recurring', () => {
        cy.contains('ธุรกรรมที่เกิดซ้ำ').click()
        cy.url({ timeout: 5000 }).should('include', '/recurring')
    })

    it('คลิกคำนวณภาษีลดหย่อน navigate ไป /tax', () => {
        cy.contains('คำนวณภาษีลดหย่อน').click()
        cy.url({ timeout: 5000 }).should('include', '/tax')
    })

    it('Export CSV เมื่อมีข้อมูล', () => {
        cy.intercept('GET', '**/api/expenses*', {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    category: 'อาหาร',
                    amount: 150,
                    type: 'EXPENSE',
                    date: '2024-11-05',
                    paymentMethod: 'เงินสด',
                    note: 'กลางวัน',
                    place: 'ร้านอาหาร',
                    occurredAt: '2024-11-05T12:00:00',
                },
            ],
        }).as('getData')

        cy.window().then((win) => {
            cy.stub(win.URL, 'createObjectURL').returns('blob:mock-url')
            cy.stub(win.URL, 'revokeObjectURL').as('revokeBlob')
        })

        cy.contains('Export CSV').click()
        cy.wait('@getData')
        cy.contains('Export CSV').should('be.visible')
    })

    it('แสดง alert เมื่อไม่มีข้อมูล Export', () => {
        cy.intercept('GET', '**/api/expenses*', {
            statusCode: 200,
            body: [],
        }).as('getEmpty')

        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alertStub')
        })

        cy.contains('Export CSV').click()
        cy.wait('@getEmpty')
        cy.get('@alertStub').should('have.been.calledOnce')
    })

    it('แสดง alert เมื่อ Export ล้มเหลว', () => {
        cy.intercept('GET', '**/api/expenses*', {
            statusCode: 500,
        }).as('getError')

        cy.window().then((win) => {
            cy.stub(win, 'alert').as('alertStub')
        })

        cy.contains('Export CSV').click()
        cy.wait('@getError')
        cy.get('@alertStub').should(
            'be.calledWith',
            'Export ข้อมูลไม่สำเร็จ ❌ (ไม่สามารถเชื่อมต่อ API ได้)'
        )
    })

    it('แสดงสถานะ "กำลังส่งออก..." ขณะ Export', () => {
        cy.intercept('GET', '**/api/expenses*', (req) => {
            req.reply({
                delay: 1000,
                statusCode: 200,
                body: [{ id: 1, category: 'test', amount: 100, type: 'EXPENSE', date: '2024-11-05' }],
            })
        }).as('getDelayed')

        cy.contains('Export CSV').click()
        cy.contains('กำลังส่งออก...').should('be.visible')
    })

    it('แสดงไอคอนครบทุกรายการ', () => {
        cy.get('.icon-wrap').should('have.length', 3)
        cy.get('.lucide').should('have.length.at.least', 3)
    })

    it('ปุ่ม disabled ขณะ Export', () => {
        cy.intercept('GET', '**/api/expenses*', (req) => {
            req.reply({
                delay: 1000,
                statusCode: 200,
                body: [{ id: 1, category: 'test', amount: 100, type: 'EXPENSE', date: '2024-11-05' }],
            })
        }).as('getDelayed2')

        cy.contains('Export CSV').click()
        cy.contains('button', 'กำลังส่งออก...').should('be.disabled')
    })
})
