/// <reference types="cypress" />

describe('Custom Income Page - User can create a new income category', () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly('admin')
        cy.visit('/income')
        cy.url().should('include', '/income')
        cy.visit('/customincome')
        cy.url().should('include', '/customincome')
    })

    it('should allow creating a new custom income category and navigate back', () => {
        const customName = 'เงินเดือนพิเศษ'
        cy.get('.cc-title').should('contain', 'Custom Income')
        cy.get('button[title="ดอกเบี้ย"]').click()
        cy.get('.cc-picked').find('svg').should('be.visible')
        cy.get('input[placeholder="ชื่อหมวดรายได้"]').type(customName)
        cy.get('.cc-confirm').click()
        cy.url().should('include', '/income')
    })

    it('should show alert if user clicks confirm without selecting icon or name', () => {
        cy.window().then((win) => cy.stub(win, 'alert').as('alertStub'))
        cy.get('.cc-confirm').click()
        cy.get('@alertStub').should('have.been.calledWith', 'กรุณาเลือกไอคอนและตั้งชื่อ')
    })

    it('should filter icons based on search query', () => {
        const searchQuery = 'ฟรีแลนซ์'
        cy.wait(800)
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('exist')
        cy.get('button[title="เงินเดือน"]').should('exist')
        cy.get('.cc-search-input').type(searchQuery)
        cy.contains('h3', 'งานเสริม & ฟรีแลนซ์').should('exist')
        cy.get('button[title="ฟรีแลนซ์"]').should('exist')
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('not.exist')
        cy.get('.cc-search-clear').click()
        cy.get('.cc-search-input').should('have.value', '')
        cy.contains('h3', 'เงินเดือน & งานประจำ').should('exist')
    })
})
