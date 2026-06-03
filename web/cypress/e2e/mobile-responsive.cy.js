const ANDROID_VIEWPORTS = [
  { width: 360, height: 800, label: "360x800" },
  { width: 390, height: 844, label: "390x844" },
  { width: 412, height: 915, label: "412x915" }
];

function assertNoHorizontalOverflow() {
  cy.document().then((doc) => {
    const root = doc.documentElement;
    const body = doc.body;
    expect(root.scrollWidth, "document width").to.be.lte(root.clientWidth + 3);
    expect(body.scrollWidth, "body width").to.be.lte(body.clientWidth + 3);
  });
}

function assertMobileControlsFit() {
  cy.get("button:visible, input:visible, select:visible, textarea:visible").each(($element) => {
    const rect = $element[0].getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      expect(rect.width, "control width").to.be.lte(Cypress.config("viewportWidth"));
    }
  });
}

function assertCatalogIsOneColumn() {
  cy.getBySel("product-card", { timeout: 20000 }).should("have.length.greaterThan", 0);
  cy.getBySel("product-card").then(($cards) => {
    const first = $cards[0].getBoundingClientRect();
    expect(first.width, "mobile product card width").to.be.greaterThan(280);

    if ($cards.length > 1) {
      const second = $cards[1].getBoundingClientRect();
      expect(Math.abs(first.left - second.left), "product cards stacked left edge").to.be.lte(3);
      expect(second.top, "second product card is below first").to.be.greaterThan(first.top);
    }
  });
}

function seedCartWithFirstProduct() {
  cy.clearCart();
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

function visitAsAdmin(path = "/admin") {
  cy.apiLogin({ email: "admin@datamak.local", password: "Admin@123" }).then((auth) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem("shop_token", auth.token);
        win.localStorage.setItem("shop_user", JSON.stringify(auth.user));
      }
    });
  });
}

describe("Android responsive layout", () => {
  ANDROID_VIEWPORTS.forEach(({ width, height, label }) => {
    context(label, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it("renders catalog and product cards as a one-column mobile layout", () => {
        cy.visit("/catalog");
        cy.get(".market-topbar").should("be.visible");
        cy.getBySel("mobile-bottom-nav").should("not.exist");
        cy.getBySel("catalog-search-input").should("be.visible");
        assertCatalogIsOneColumn();
        assertMobileControlsFit();
        assertNoHorizontalOverflow();
      });

      it("keeps auth, hosting, cart, checkout, orders, details, and admin pages within Android width", () => {
        cy.visit("/auth");
        cy.getBySel("auth-page").should("be.visible");
        cy.getBySel("auth-tab-register").click();
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        cy.visit("/hosting");
        cy.contains("Web Hosting Services").should("be.visible");
        cy.get(".hosting-card", { timeout: 20000 }).should("have.length.greaterThan", 0);
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        seedCartWithFirstProduct();
        cy.visitAsCustomer("/cart");
        cy.getBySel("cart-item", { timeout: 20000 }).should("be.visible");
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        cy.getBySel("proceed-to-checkout-button").click();
        cy.location("pathname").should("eq", "/checkout");
        cy.getBySel("checkout-page").should("be.visible");
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        cy.visitAsCustomer("/orders");
        cy.contains("Order Tracking").should("be.visible");
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        cy.request(`${Cypress.env("apiUrl")}/products?pageSize=1`).then(({ body }) => {
          cy.visit(`/products/${body.products[0].id}`);
        });
        cy.contains("Specifications", { timeout: 20000 }).should("be.visible");
        assertMobileControlsFit();
        assertNoHorizontalOverflow();

        visitAsAdmin("/admin");
        cy.contains("Recent Orders", { timeout: 20000 }).should("be.visible");
        cy.contains("Products").click();
        cy.contains("Add Product").should("be.visible");
        assertMobileControlsFit();
        assertNoHorizontalOverflow();
      });
    });
  });
});
