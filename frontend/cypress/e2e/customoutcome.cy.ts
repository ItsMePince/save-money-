/// <reference types="cypress" />

describe('Custom Outcome Page - ผู้ใช้สามารถสร้างหมวดรายจ่ายใหม่', () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin')
        cy.visit('/expense')
        cy.url().should('include', '/expense')
        cy.visit('/customoutcome')
        cy.url().should('include', '/customoutcome')
    })

    it('should allow creating a new custom outcome category and navigate back', () => {
        const customName = 'ของใช้ในบ้าน'
        cy.contains('.cc-title', 'Custom Outcome').should('be.visible')
        cy.get('.cc-group').first().find('.cc-chip').first().click()
        cy.get('.cc-picked').find('svg').should('be.visible')
        cy.get('input[placeholder="ชื่อหมวดรายจ่าย"]').type(customName)
        cy.get('.cc-confirm').click()
        cy.url().should('include', '/expense')
    })

    it('should alert when confirming without selecting icon or name', () => {
        cy.window().then((win) => cy.stub(win, 'alert').as('alertStub'))
        cy.get('.cc-confirm').click()
        cy.get('@alertStub').should('have.been.calledWith', 'กรุณาเลือกไอคอนและตั้งชื่อ')
        cy.get('.cc-group').first().find('.cc-chip').first().click()
        cy.get('.cc-confirm').click()
        cy.get('@alertStub').should('have.been.calledTwice')
    })

    it('should filter icons correctly when searching', () => {
        cy.wait(300)
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('exist')
        cy.get('.cc-group').first().find('.cc-chip').its('length').should('be.gte', 1)

        cy.get('.cc-search-input').clear().type('กาแฟ')
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('exist')
        cy.get('.cc-grid .cc-chip:visible').its('length').should('be.gte', 1)
        cy.get('.cc-search-clear').click()

        cy.get('.cc-search-input').type('การเงิน')
        cy.contains('h3', 'การเงิน & อื่น ๆ').should('exist')
        cy.get('.cc-grid .cc-chip:visible').its('length').should('be.gte', 1)
        cy.get('.cc-search-clear').click()

        cy.get('.cc-search-input').should('have.value', '')
        cy.contains('h3', 'อาหาร & เครื่องดื่ม').should('exist')
        cy.get('.cc-group').first().find('.cc-chip').its('length').should('be.gte', 1)
    })
})
