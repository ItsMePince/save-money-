// cypress/e2e/income.cy.ts
/// <reference types="cypress" />

describe('Income Page - User can record a new income entry', () => {
    const testAmount = '1234.56'
    const testNote = 'เงินเดือนเดือนล่าสุด'
    const testPlace = 'บริษัท A'
    const paymentMethodName = 'ธนาคารกสิกร'

    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin')

        cy.window().then((win) => {
            const draft = {
                payment: { name: paymentMethodName },
                place: testPlace,
            }
            win.sessionStorage.setItem('income_draft_v2', JSON.stringify(draft))
            win.sessionStorage.removeItem('paymentMethod')
            win.sessionStorage.removeItem('edit_id_income')
        })

        cy.visit('/income')
    })

    it('should successfully record a new income entry', () => {
        cy.get('.type-pill .pill').should('contain', 'รายได้')
        cy.contains('button.cat', 'ค่าขนม').should('have.class', 'active')

        cy.get('.keypad button').contains('1').click()
        cy.get('.keypad button').contains('2').click()
        cy.get('.keypad button').contains('3').click()
        cy.get('.keypad button').contains('4').click()
        cy.get('.keypad button').contains('.').click()
        cy.get('.keypad button').contains('5').click()
        cy.get('.keypad button').contains('6').click()
        cy.get('.amount-input').should('have.value', testAmount)

        cy.get('.inputs input[placeholder="โน้ต"]').type(testNote)
        cy.get('.inputs input[placeholder="สถานที่"]').should('have.value', testPlace)
        cy.get('.segments button.seg').contains(paymentMethodName).should('exist')

        cy.intercept('POST', '**/api/expenses', {
            statusCode: 201,
            body: { id: 'mock-income-1', message: 'Success' },
        }).as('createIncome')

        cy.on('window:alert', (text) => {
            expect(text).to.eq('บันทึกเรียบร้อย ✅')
        })
        cy.get('.confirm .ok-btn').click()
    })
})
