describe("Repeated Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly();

        const mockRepeated = [
            {
                id: 1,
                name: "Netflix",
                amount: 300,
                date: 15,
                type: "EXPENSE",
                iconKey: "netflix"
            }
        ];

        cy.intercept("GET", "**/api/repeated-transactions*", {
            statusCode: 200,
            body: mockRepeated
        }).as("repList");

        cy.visit("/repeated-transactions");
    });

    it("renders repeated list", () => {
        cy.wait("@repList");

        cy.contains("Netflix").should("exist");
        cy.contains("300").should("exist");
    });
});
