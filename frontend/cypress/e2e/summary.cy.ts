describe("Summary Page", () => {
    beforeEach(() => {
        cy.mockLoginFrontendOnly();

        const mockSummary = [
            {
                date: "2025-11-15",
                total: -89,
                items: [
                    {
                        id: 1,
                        type: "EXPENSE",
                        category: "ค่าเดินทาง",
                        amount: 89,
                        note: "test",
                        occurredAt: "2025-11-15T10:00:00"
                    }
                ]
            }
        ];

        cy.intercept("GET", "**/api/summary*", {
            statusCode: 200,
            body: mockSummary
        }).as("summary");

        cy.visit("/summary");
    });

    it("renders summary page", () => {
        cy.wait("@summary");

        cy.contains("รวม").should("exist");
        cy.contains("ค่าเดินทาง").should("exist");
        cy.contains("-89").should("exist");
    });
});
