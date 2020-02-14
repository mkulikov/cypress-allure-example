describe('Test', function () {
    it('Test failed', () => {
        cy.wrap(3).should('eq', 2)
    });

    it('Test passed', () => {
        cy.wrap(3).should('eq', 3)
    });

    it.skip('Test skipped', () => {
        cy.wrap(3).should('eq', 3)
    });
})
