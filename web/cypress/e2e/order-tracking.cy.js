function createOrderForCustomer() {
  return cy.apiLogin().then((auth) => {
    return cy.request(`${Cypress.env("apiUrl")}/products?pageSize=1`).then(({ body }) => {
      const productId = body?.products?.[0]?.id;
      expect(productId, "product id for order setup").to.be.a("string").and.not.be.empty;

      return cy
        .request({
          method: "DELETE",
          url: `${Cypress.env("apiUrl")}/cart`,
          headers: { Authorization: `Bearer ${auth.token}` }
        })
        .then(() =>
          cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/cart/items`,
            headers: { Authorization: `Bearer ${auth.token}` },
            body: { productId, quantity: 1 }
          })
        )
        .then(() =>
          cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/checkout`,
            headers: { Authorization: `Bearer ${auth.token}` },
            body: {
              paymentMethod: "Debit card",
              paymentDetails: {
                cardNumber: "4111111111111111",
                cvc: "123"
              },
              shippingAddress: "Not required"
            }
          })
        )
        .then(({ body: checkoutBody }) => checkoutBody.order.id);
    });
  });
}

describe("Order tracking", () => {
  beforeEach(() => {
    createOrderForCustomer().as("createdOrderId");
  });

  it("shows placed order in tracking list and details timeline", function () {
    cy.intercept("GET", "**/api/orders").as("ordersRequest");
    cy.intercept("GET", "**/api/orders/*").as("orderDetailsRequest");

    cy.visitAsCustomer("/orders");
    cy.wait("@ordersRequest").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body?.orders?.length).to.be.greaterThan(0);
    });

    cy.getBySel("orders-list").should("be.visible");

    cy.get("@createdOrderId").then((orderId) => {
      cy.get(`[data-cy="order-card"][data-order-id="${orderId}"]`).as("createdOrderCard");
      cy.get("@createdOrderCard").should("exist");
      cy.get("@createdOrderCard").find('[data-cy="order-status"]').should("contain.text", "Paid");
      cy.get("@createdOrderCard").find('[data-cy="view-order-button"]').click();
    });

    cy.wait("@orderDetailsRequest").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
    });

    cy.location("pathname").should("match", /^\/orders\/.+$/);
    cy.getBySel("order-details-status").should("contain.text", "Paid");
    cy.getBySel("order-timeline-item").its("length").should("be.gte", 2);
    cy.getBySel("order-status-timeline").should("contain.text", "Pending");
    cy.getBySel("order-status-timeline").should("contain.text", "Paid");
  });
});
