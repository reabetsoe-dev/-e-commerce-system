function seedCartWithFirstProduct() {
  cy.apiLogin().then((auth) => {
    cy.request(`${Cypress.env("apiUrl")}/products?pageSize=1`).then(({ body }) => {
      const productId = body?.products?.[0]?.id;
      expect(productId, "seed product id").to.be.a("string").and.not.be.empty;

      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/cart/items`,
        headers: {
          Authorization: `Bearer ${auth.token}`
        },
        body: {
          productId,
          quantity: 1
        }
      }).its("status").should("eq", 201);
    });
  });
}

describe("Checkout process", () => {
  beforeEach(() => {
    cy.clearCart();
    seedCartWithFirstProduct();
  });

  it("completes checkout and lands on success page", () => {
    cy.intercept("POST", "**/api/checkout").as("checkoutRequest");

    cy.visitAsCustomer("/cart");
    cy.getBySel("proceed-to-checkout-button").click();
    cy.location("pathname").should("eq", "/checkout");

    cy.getBySel("checkout-payment-method").contains("Mpesa").click();
    cy.getBySel("checkout-lesotho-number").type("+266 5800 0000");
    cy.getBySel("checkout-payment-total").should("be.visible");
    cy.getBySel("checkout-payment-amount").should("not.exist");
    cy.getBySel("checkout-continue-button").click();
    cy.getBySel("checkout-place-order-button").click();

    cy.wait("@checkoutRequest").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body?.order?.id).to.be.a("string");
    });

    cy.location("pathname").should("match", /^\/checkout\/success\/.+$/);
    cy.getBySel("checkout-success-page").should("be.visible");
    cy.getBySel("view-order-details-button").should("be.visible");
  });
});
