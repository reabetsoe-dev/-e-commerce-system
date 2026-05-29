import os
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "docs")
os.makedirs(OUT_DIR, exist_ok=True)
OUT_FILE = os.path.join(OUT_DIR, "Ecommerce_Test_Plan_and_Test_Cases.docx")

content = []


def add_title(text):
    content.append((text, True, 36))


def add_h1(text):
    content.append((text, True, 30))


def add_h2(text):
    content.append((text, True, 26))


def add_p(text=""):
    content.append((text, False, 22))


def add_bullet(text):
    content.append((f"- {text}", False, 22))


add_title("Datamak Ecommerce System")
add_title("Master Test Plan and Detailed Test Cases")
add_p("")
add_p("Document Version: 1.0")
add_p("Prepared Date: May 11, 2026")
add_p("Application Under Test: Next.js + React ecommerce platform")
add_p(
    "Modules: Authentication, Catalog Search/Filtering, Cart, Checkout, Orders, Admin, Responsive UX"
)
add_p("")

add_h1("1. Test Plan")
add_h2("1.1 Purpose")
add_p(
    "This document defines the end-to-end test strategy and detailed test cases for the Datamak ecommerce system."
)
add_p(
    "It is designed to support assignment submission, regression testing, and production-readiness checks."
)
add_p("")

add_h2("1.2 Test Objectives")
for bullet in [
    "Verify all critical ecommerce workflows function correctly from UI to API behavior.",
    "Confirm smart search and technical filtering behavior for Computers, ICT Products, and Web Hosting Services.",
    "Validate cart, checkout, and order confirmation reliability.",
    "Validate admin product/order management and access control.",
    "Confirm responsive behavior on mobile, tablet, and desktop viewports.",
    "Ensure stable automated E2E execution in Cypress with reproducible results.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.3 Scope")
add_p("In Scope:")
for bullet in [
    "Customer login and registration flows.",
    "Catalog search, autocomplete, filter combinations, and loading/empty states.",
    "Add to cart, remove item, quantity updates, and cart persistence.",
    "Checkout step flow, payment simulation, success page, and error handling.",
    "Admin dashboard: add/edit/delete products, update order status, and summary metrics.",
    "Responsive interactions for iPhone, Samsung, iPad, and desktop layouts.",
    "Cypress artifacts: screenshots on failure and video capture.",
]:
    add_bullet(bullet)
add_p("Out of Scope for this test cycle:")
for bullet in [
    "Third-party real payment gateway certification.",
    "Load testing and penetration testing beyond functional E2E scope.",
    "Email delivery verification for password reset in production mail services.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.4 Test Approach")
for bullet in [
    "Primary level: End-to-End functional testing using Cypress.",
    "Execution mode: Mocked API flows using cy.intercept for deterministic and repeatable tests.",
    "Selector strategy: data-testid based selectors for stability.",
    "Coverage style: Positive, negative, boundary, and responsive viewport scenarios.",
    "Regression strategy: Re-run full suite after major UI, API, or filter logic updates.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.5 Test Environment")
for bullet in [
    "Frontend URL: http://127.0.0.1:5173",
    "API URL (Cypress env): http://localhost:4000/api",
    "Framework: Next.js/React frontend with Node.js backend APIs",
    "Automation Tool: Cypress 13.x",
    "Browsers: Edge, Electron, Firefox (as configured in Cypress runner)",
    "Viewports: iPhone, Samsung Galaxy, iPad, Desktop",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.6 Entry Criteria")
for bullet in [
    "Application builds and starts successfully.",
    "Catalog/seed data available for all 3 business categories.",
    "Cypress installed and configured (baseUrl, fixtures, support commands).",
    "Required test accounts and mocked API handlers available.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.7 Exit Criteria")
for bullet in [
    "100% of High-priority test cases executed.",
    "No open Critical defects and no open High defects blocking checkout or auth.",
    "At least 95% pass rate across automated E2E suites.",
    "All failed tests triaged with defect logs and reproduction evidence.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.8 Defect Severity and Priority")
for bullet in [
    "Critical: System crash, security bypass, or checkout blocked for all users.",
    "High: Core flow broken (login, cart, checkout, admin management).",
    "Medium: Feature works partially with workaround.",
    "Low: UI inconsistencies, copy issues, non-blocking behavior.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.9 Risks and Mitigation")
for bullet in [
    "Risk: Environment mismatch (wrong baseUrl/port). Mitigation: enforce startup checklist before test run.",
    "Risk: Flaky tests due to async rendering. Mitigation: use stable intercept waits and test IDs.",
    "Risk: Data drift in backend seed data. Mitigation: reset catalog version/fixtures per cycle.",
    "Risk: Responsive regressions after CSS updates. Mitigation: run viewport suite in every regression pass.",
]:
    add_bullet(bullet)
add_p("")

add_h2("1.10 Deliverables")
for bullet in [
    "This test plan and detailed test case document.",
    "Cypress E2E test suite and support files.",
    "Execution evidence: screenshots, videos, and console logs.",
    "Defect report with severity, status, and retest outcome.",
]:
    add_bullet(bullet)
add_p("")

add_h1("2. Requirement Coverage Matrix")
coverage = [
    (
        "REQ-AUTH",
        "Login, registration, logout, session persistence, protected routes",
        "AUTH-001..AUTH-006, REG-001..REG-005",
    ),
    ("REQ-SEARCH", "Search, no-result state, live update, suggestions", "SRCH-001..SRCH-006"),
    (
        "REQ-FILTER",
        "Category/brand/processor/RAM/hosting filters, clear all, counts",
        "FILT-001..FILT-012",
    ),
    ("REQ-SORT", "Default newest sorting", "SORT-001"),
    ("REQ-LOADING", "Catalog loading shimmer/state", "LOAD-001"),
    ("REQ-CART", "Add/remove/update/persist/multi-item cart", "CART-001..CART-006"),
    (
        "REQ-CHECKOUT",
        "Checkout flow, success, API failure, empty-cart prevention",
        "CHK-001..CHK-007",
    ),
    (
        "REQ-ADMIN",
        "Admin dashboard and CRUD/order management/access control",
        "ADM-001..ADM-007",
    ),
    ("REQ-RESPONSIVE", "Mobile/tablet/desktop behavior", "RWD-001..RWD-005"),
]
for req, feature, tc in coverage:
    add_p(f"{req} | {feature} | {tc}")
add_p("")

add_h1("3. Detailed Test Cases")
cases = [
    {
        "id": "AUTH-001",
        "module": "Authentication",
        "title": "Login succeeds with valid customer credentials",
        "pre": "User is on /auth and valid customer credentials exist.",
        "steps": "1) Open /auth. 2) Enter valid email and password. 3) Click Login.",
        "expected": "User is redirected to / and authenticated session token is stored.",
        "priority": "High",
        "type": "Positive, Functional, Automated (Cypress)",
    },
    {
        "id": "AUTH-002",
        "module": "Authentication",
        "title": "Login fails for invalid credentials",
        "pre": "User is on /auth.",
        "steps": "1) Enter invalid email/password. 2) Click Login.",
        "expected": "Error message appears and user remains on /auth.",
        "priority": "High",
        "type": "Negative, Functional, Automated (Cypress)",
    },
    {
        "id": "AUTH-003",
        "module": "Authentication",
        "title": "Required login fields validation",
        "pre": "User is on /auth.",
        "steps": "1) Leave fields empty. 2) Click Login.",
        "expected": "Browser/form validation blocks submission and shows required field feedback.",
        "priority": "High",
        "type": "Negative, UI Validation, Automated (Cypress)",
    },
    {
        "id": "AUTH-004",
        "module": "Authentication",
        "title": "Protected route redirects unauthenticated user to login",
        "pre": "User is logged out.",
        "steps": "1) Open /cart directly. 2) Complete login with valid credentials.",
        "expected": "User is redirected to /auth first, then returned to /cart after login.",
        "priority": "High",
        "type": "Functional, Security/Access, Automated (Cypress)",
    },
    {
        "id": "AUTH-005",
        "module": "Authentication",
        "title": "Session persists on reload",
        "pre": "User has logged in successfully.",
        "steps": "1) Navigate to /catalog. 2) Reload page.",
        "expected": "User stays authenticated and logout button remains visible.",
        "priority": "High",
        "type": "Functional, Session, Automated (Cypress)",
    },
    {
        "id": "AUTH-006",
        "module": "Authentication",
        "title": "Logout clears local session",
        "pre": "User is logged in.",
        "steps": "1) Click Logout. 2) Inspect auth state.",
        "expected": "Token is removed from local storage and Login/Register link is shown.",
        "priority": "High",
        "type": "Functional, Security, Automated (Cypress)",
    },
    {
        "id": "REG-001",
        "module": "Registration",
        "title": "Register new account successfully",
        "pre": "User is on register mode at /auth.",
        "steps": "1) Enter valid name/email/password/confirm password. 2) Submit form.",
        "expected": "Account is created and user is logged in and redirected to /.",
        "priority": "High",
        "type": "Positive, Functional, Automated (Cypress)",
    },
    {
        "id": "REG-002",
        "module": "Registration",
        "title": "Email format validation on registration",
        "pre": "User is on register mode.",
        "steps": "1) Enter malformed email. 2) Submit form.",
        "expected": "Validation error appears for invalid email format.",
        "priority": "High",
        "type": "Negative, Validation, Automated (Cypress)",
    },
    {
        "id": "REG-003",
        "module": "Registration",
        "title": "Password complexity validation",
        "pre": "User is on register mode.",
        "steps": "1) Enter weak password without required complexity. 2) Submit.",
        "expected": "Error indicates password must include uppercase, lowercase, and number.",
        "priority": "High",
        "type": "Negative, Validation, Automated (Cypress)",
    },
    {
        "id": "REG-004",
        "module": "Registration",
        "title": "Duplicate account prevention",
        "pre": "A user already exists with target email.",
        "steps": "1) Register using existing email. 2) Submit form.",
        "expected": "Registration is rejected with duplicate account message.",
        "priority": "High",
        "type": "Negative, Functional, Automated (Cypress)",
    },
    {
        "id": "REG-005",
        "module": "Registration",
        "title": "Required registration fields validation",
        "pre": "User is on register mode.",
        "steps": "1) Leave mandatory fields empty. 2) Submit form.",
        "expected": "Form validation blocks submit and indicates missing fields.",
        "priority": "High",
        "type": "Negative, Validation, Automated (Cypress)",
    },
    {
        "id": "SRCH-001",
        "module": "Catalog Search",
        "title": "Search filters products by keyword",
        "pre": "Catalog page loaded with product data.",
        "steps": "1) Enter keyword (example: Dell) in search input.",
        "expected": "Only matching products appear in grid.",
        "priority": "High",
        "type": "Positive, Functional, Automated (Cypress)",
    },
    {
        "id": "SRCH-002",
        "module": "Catalog Search",
        "title": "No-results empty state",
        "pre": "Catalog page loaded.",
        "steps": "1) Search for non-existing text. 2) Observe result area.",
        "expected": "Clear empty-state panel appears with clear-filters action.",
        "priority": "High",
        "type": "Negative, UX, Automated (Cypress)",
    },
    {
        "id": "SRCH-003",
        "module": "Catalog Search",
        "title": "Debounced live update of results",
        "pre": "Catalog page loaded with baseline product count.",
        "steps": "1) Enter targeted search term. 2) Wait for debounce interval.",
        "expected": "Result count updates dynamically without page reload.",
        "priority": "High",
        "type": "Functional, Performance-UX, Automated (Cypress)",
    },
    {
        "id": "SRCH-004",
        "module": "Catalog Search",
        "title": "Autocomplete search suggestions",
        "pre": "Catalog page loaded.",
        "steps": "1) Type partial query (example: host). 2) Inspect suggestion list.",
        "expected": "Suggestion list returns relevant terms including hosting items.",
        "priority": "Medium",
        "type": "Functional, UX, Automated (Cypress)",
    },
    {
        "id": "SRCH-005",
        "module": "Catalog Search",
        "title": "Clear search input resets query",
        "pre": "Search input contains text.",
        "steps": "1) Click Clear search button.",
        "expected": "Input becomes empty and full matching dataset is restored.",
        "priority": "Medium",
        "type": "Functional, UX, Automated (Cypress)",
    },
    {
        "id": "SRCH-006",
        "module": "Catalog Search",
        "title": "Search usability on small screens",
        "pre": "Viewport set to mobile.",
        "steps": "1) Execute search on iPhone-sized viewport. 2) Clear search.",
        "expected": "Search remains usable and results update correctly on mobile.",
        "priority": "Medium",
        "type": "Responsive, Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-001",
        "module": "Catalog Filters",
        "title": "Category filter: Computers",
        "pre": "Catalog page loaded.",
        "steps": "1) Expand Categories. 2) Select Computers.",
        "expected": "Grid updates to show only computer-category products.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-002",
        "module": "Catalog Filters",
        "title": "Combined filters: Brand + Processor + RAM",
        "pre": "Catalog loaded in Computers context.",
        "steps": "1) Select brand (example: Dell). 2) Select processor (Intel Core i5). 3) Select RAM (16GB).",
        "expected": "Only products matching all selected filters remain.",
        "priority": "High",
        "type": "Functional, Combination, Automated (Cypress)",
    },
    {
        "id": "FILT-003",
        "module": "Catalog Filters",
        "title": "ICT filters: subcategory + brand",
        "pre": "Catalog loaded.",
        "steps": "1) Select ICT Products category. 2) Select Networking Equipment. 3) Select brand TP-Link.",
        "expected": "Grid narrows to ICT networking products for selected brand.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-004",
        "module": "Catalog Filters",
        "title": "Web Hosting filters: type + OS + billing",
        "pre": "Catalog loaded.",
        "steps": "1) Select Web Hosting Services. 2) Select VPS Hosting. 3) Select Linux. 4) Select Monthly billing.",
        "expected": "Hosting grid shows only plans matching all selected hosting attributes.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-005",
        "module": "Catalog Filters",
        "title": "Price range slider updates results dynamically",
        "pre": "Catalog loaded with multiple price points.",
        "steps": "1) Adjust max price slider downward. 2) Observe count/grid update.",
        "expected": "Result count decreases and grid updates without reload.",
        "priority": "High",
        "type": "Boundary, Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-006",
        "module": "Catalog Filters",
        "title": "Availability and out-of-stock behavior",
        "pre": "Catalog includes at least one out-of-stock product.",
        "steps": "1) Locate an out-of-stock item. 2) Check add-to-cart control.",
        "expected": "Add-to-cart is disabled and item clearly shows out-of-stock state.",
        "priority": "High",
        "type": "Functional, UX, Automated (Cypress)",
    },
    {
        "id": "FILT-007",
        "module": "Catalog Filters",
        "title": "Clear All resets all filters",
        "pre": "Multiple filters and/or search text are active.",
        "steps": "1) Click Clear All.",
        "expected": "Search and all filters reset to defaults and active filter count returns to 0.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-008",
        "module": "Catalog Filters",
        "title": "Active filter counter accuracy",
        "pre": "Filter sidebar visible.",
        "steps": "1) Apply one or more filters. 2) Observe active count indicator.",
        "expected": "Active filter count matches number of selected filter conditions.",
        "priority": "Medium",
        "type": "Functional, UI, Manual/Automated",
    },
    {
        "id": "FILT-009",
        "module": "Catalog Filters",
        "title": "Accordion expand/collapse behavior",
        "pre": "Filter sidebar visible.",
        "steps": "1) Toggle filter section dropdowns repeatedly.",
        "expected": "Sections open/close smoothly and preserve selected filter states.",
        "priority": "Medium",
        "type": "UX, Functional, Manual",
    },
    {
        "id": "FILT-010",
        "module": "Catalog Filters",
        "title": "Mobile filter usability",
        "pre": "Viewport set to mobile.",
        "steps": "1) Apply category filter on mobile viewport. 2) Verify grid updates.",
        "expected": "Filtering remains functional and touch interactions are responsive.",
        "priority": "High",
        "type": "Responsive, Functional, Automated (Cypress)",
    },
    {
        "id": "FILT-011",
        "module": "Catalog Filters",
        "title": "Hosting storage slider/preset behavior",
        "pre": "Web Hosting category selected.",
        "steps": "1) Change storage min/max sliders or range presets.",
        "expected": "Only hosting plans within storage range are shown.",
        "priority": "Medium",
        "type": "Boundary, Functional, Manual",
    },
    {
        "id": "FILT-012",
        "module": "Catalog Filters",
        "title": "Hosting bandwidth slider/preset behavior",
        "pre": "Web Hosting category selected.",
        "steps": "1) Change bandwidth min/max sliders or preset chips.",
        "expected": "Only plans within selected bandwidth range are displayed.",
        "priority": "Medium",
        "type": "Boundary, Functional, Manual",
    },
    {
        "id": "SORT-001",
        "module": "Catalog Sorting",
        "title": "Default sort order is Newest",
        "pre": "Catalog loaded with known seeded order.",
        "steps": "1) Open catalog without applying sort override. 2) Inspect first card.",
        "expected": "Products appear in newest-first order according to createdAt sort.",
        "priority": "Medium",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "LOAD-001",
        "module": "Catalog Loading",
        "title": "Loading state while products fetch",
        "pre": "API response is delayed.",
        "steps": "1) Open /catalog under delayed response. 2) Observe loading panel. 3) Wait for response.",
        "expected": "Loading state appears first, then grid renders after API response.",
        "priority": "Medium",
        "type": "UX, Async, Automated (Cypress)",
    },
    {
        "id": "CART-001",
        "module": "Cart",
        "title": "Add product to cart from catalog",
        "pre": "Authenticated customer session.",
        "steps": "1) Open /catalog. 2) Click Add to Cart on a product. 3) Open /cart.",
        "expected": "Selected product appears in cart item list.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CART-002",
        "module": "Cart",
        "title": "Remove product from cart",
        "pre": "Cart has at least one item.",
        "steps": "1) Click remove on one cart item.",
        "expected": "Item is removed and cart item count decreases by one.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CART-003",
        "module": "Cart",
        "title": "Update quantity recalculates totals",
        "pre": "Cart has quantity-editable items.",
        "steps": "1) Change quantity for an item. 2) Observe subtotal/total.",
        "expected": "Totals recalculate correctly and increase/decrease based on quantity.",
        "priority": "High",
        "type": "Functional, Calculation, Automated (Cypress)",
    },
    {
        "id": "CART-004",
        "module": "Cart",
        "title": "Cart persistence after page reload",
        "pre": "Cart has modified quantity/data.",
        "steps": "1) Update quantity. 2) Reload page.",
        "expected": "Updated cart state remains persisted after reload.",
        "priority": "High",
        "type": "Functional, Persistence, Automated (Cypress)",
    },
    {
        "id": "CART-005",
        "module": "Cart",
        "title": "Multiple products in same cart",
        "pre": "Authenticated user and catalog loaded.",
        "steps": "1) Add two or more different products. 2) Open cart.",
        "expected": "Cart displays multiple line items with correct totals.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CART-006",
        "module": "Cart",
        "title": "Cart route is protected for logged-out users",
        "pre": "No authenticated session.",
        "steps": "1) Open /cart directly.",
        "expected": "System redirects to /auth before allowing cart access.",
        "priority": "High",
        "type": "Security/Access, Functional, Manual",
    },
    {
        "id": "CHK-001",
        "module": "Checkout",
        "title": "Checkout page loads for non-empty cart",
        "pre": "Authenticated user with at least one cart item.",
        "steps": "1) Open /checkout.",
        "expected": "Checkout page, stepper, and order summary are visible.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CHK-002",
        "module": "Checkout",
        "title": "Continue from Payment step to Review step",
        "pre": "Checkout page open at step 1.",
        "steps": "1) Click Continue.",
        "expected": "Review stage opens and selected cart items are listed.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CHK-003",
        "module": "Checkout",
        "title": "Place order successfully",
        "pre": "Checkout at Review step.",
        "steps": "1) Click Place Order.",
        "expected": "Checkout API succeeds and user is redirected to /checkout/success/{orderId}.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CHK-004",
        "module": "Checkout",
        "title": "Order confirmation can navigate to order details",
        "pre": "User is on checkout success page.",
        "steps": "1) Click View Order Details.",
        "expected": "Order details page loads and order info is visible.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "CHK-005",
        "module": "Checkout",
        "title": "Checkout handles API/payment failure",
        "pre": "Checkout at Review step; API mocked to return 500.",
        "steps": "1) Click Place Order.",
        "expected": "User remains on checkout page and clear error message is displayed.",
        "priority": "High",
        "type": "Negative, Error Handling, Automated (Cypress)",
    },
    {
        "id": "CHK-006",
        "module": "Checkout",
        "title": "Empty cart checkout prevention",
        "pre": "Authenticated user with empty cart.",
        "steps": "1) Open /checkout.",
        "expected": "No checkout steps displayed; empty-state warning prompts user to add items.",
        "priority": "High",
        "type": "Negative, Functional, Automated (Cypress)",
    },
    {
        "id": "CHK-007",
        "module": "Checkout",
        "title": "Back navigation behavior in checkout",
        "pre": "Checkout page loaded.",
        "steps": "1) Click back-to-cart arrow. 2) Re-open checkout and move to Review. 3) Click Back step button.",
        "expected": "Back-to-cart navigates to /cart; Back step returns from Review to Payment stage.",
        "priority": "Medium",
        "type": "Functional, UX, Manual",
    },
    {
        "id": "ADM-001",
        "module": "Admin",
        "title": "Admin login opens dashboard",
        "pre": "Valid admin credentials exist.",
        "steps": "1) Login as admin.",
        "expected": "User is routed to /admin and dashboard tiles are visible.",
        "priority": "High",
        "type": "Functional, Security/Role, Automated (Cypress)",
    },
    {
        "id": "ADM-002",
        "module": "Admin",
        "title": "Non-admin user cannot access /admin",
        "pre": "Customer user logged in.",
        "steps": "1) Open /admin directly.",
        "expected": "User is redirected away from admin route (to /).",
        "priority": "High",
        "type": "Security/Access, Automated (Cypress)",
    },
    {
        "id": "ADM-003",
        "module": "Admin",
        "title": "Admin can add product",
        "pre": "Admin is on product management panel.",
        "steps": "1) Fill add product form. 2) Submit.",
        "expected": "New product row appears in product table.",
        "priority": "High",
        "type": "CRUD, Functional, Automated (Cypress)",
    },
    {
        "id": "ADM-004",
        "module": "Admin",
        "title": "Admin can edit product category",
        "pre": "Admin product table loaded.",
        "steps": "1) Change category in product row selector.",
        "expected": "Update API is called and product row reflects updated category.",
        "priority": "High",
        "type": "CRUD, Functional, Automated (Cypress)",
    },
    {
        "id": "ADM-005",
        "module": "Admin",
        "title": "Admin can delete product",
        "pre": "Admin product table has at least one row.",
        "steps": "1) Delete one product row.",
        "expected": "Row count decreases by one and catalog refreshes.",
        "priority": "High",
        "type": "CRUD, Functional, Automated (Cypress)",
    },
    {
        "id": "ADM-006",
        "module": "Admin",
        "title": "Admin can update order status",
        "pre": "Admin is on orders panel with existing orders.",
        "steps": "1) Change order status (example: Shipped).",
        "expected": "Order status update API succeeds and value is persisted.",
        "priority": "High",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "ADM-007",
        "module": "Admin",
        "title": "Admin summary statistics load",
        "pre": "Admin dashboard summary panel accessible.",
        "steps": "1) Open summary tile.",
        "expected": "Users, products, orders, and revenue metrics are displayed.",
        "priority": "Medium",
        "type": "Functional, Automated (Cypress)",
    },
    {
        "id": "RWD-001",
        "module": "Responsive",
        "title": "iPhone mobile navbar interaction",
        "pre": "Viewport set to iPhone.",
        "steps": "1) Open catalog. 2) Open mobile menu. 3) Navigate via menu.",
        "expected": "Menu toggles correctly and selected navigation route loads.",
        "priority": "Medium",
        "type": "Responsive, UX, Automated (Cypress)",
    },
    {
        "id": "RWD-002",
        "module": "Responsive",
        "title": "Samsung viewport filter and touch interaction",
        "pre": "Viewport set to Samsung size.",
        "steps": "1) Apply mobile category filter. 2) Perform touchstart on product card. 3) Add to cart.",
        "expected": "Filtering and touch-based product interaction work without layout break.",
        "priority": "Medium",
        "type": "Responsive, Functional, Automated (Cypress)",
    },
    {
        "id": "RWD-003",
        "module": "Responsive",
        "title": "iPad/tablet checkout layout integrity",
        "pre": "Viewport set to iPad.",
        "steps": "1) Open /checkout.",
        "expected": "Checkout page, stepper, and totals panel are visible and readable.",
        "priority": "Medium",
        "type": "Responsive, Layout, Automated (Cypress)",
    },
    {
        "id": "RWD-004",
        "module": "Responsive",
        "title": "Desktop catalog sidebar and grid stability",
        "pre": "Viewport set to desktop.",
        "steps": "1) Open /catalog.",
        "expected": "Filter sidebar remains visible and product grid renders multiple cards.",
        "priority": "Medium",
        "type": "Responsive, Layout, Automated (Cypress)",
    },
    {
        "id": "RWD-005",
        "module": "Responsive",
        "title": "Cross-browser smoke execution",
        "pre": "Cypress runner supports Edge/Electron/Firefox on test machine.",
        "steps": "1) Run smoke suite in each browser profile.",
        "expected": "No browser-specific blocker in auth, catalog, cart, and checkout critical flows.",
        "priority": "Medium",
        "type": "Compatibility, Manual/Automated",
    },
]

for idx, tc in enumerate(cases, start=1):
    add_h2(f"3.{idx} {tc['id']} - {tc['title']}")
    add_p(f"Module: {tc['module']}")
    add_p(f"Priority: {tc['priority']}")
    add_p(f"Test Type: {tc['type']}")
    add_p(f"Preconditions: {tc['pre']}")
    add_p(f"Test Steps: {tc['steps']}")
    add_p(f"Expected Result: {tc['expected']}")
    add_p("")

add_h1("4. Execution Checklist")
for bullet in [
    "Start frontend server at http://127.0.0.1:5173 before running Cypress.",
    "Confirm cypress baseUrl matches running frontend port.",
    "Run smoke suite first, then full regression suite.",
    "Collect screenshots and videos for any failure.",
    "Log every defect with test case ID reference and reproduction steps.",
    "Retest fixed defects and run impacted regression subset.",
]:
    add_bullet(bullet)
add_p("")

add_h1("5. Sign-off")
add_p("QA Lead: __________________________")
add_p("Project Supervisor: __________________________")
add_p("Sign-off Date: __________________________")


def build_run(text, bold=False, size=22):
    rpr = []
    if bold:
        rpr.append("<w:b/>")
    rpr.append(f"<w:sz w:val=\"{size}\"/>")
    rpr.append(f"<w:szCs w:val=\"{size}\"/>")
    escaped = escape(text)
    return (
        f"<w:r><w:rPr>{''.join(rpr)}</w:rPr>"
        f"<w:t xml:space=\"preserve\">{escaped}</w:t></w:r>"
    )


def build_paragraph(text, bold=False, size=22):
    if text == "":
        return "<w:p/>"
    return f"<w:p>{build_run(text, bold=bold, size=size)}</w:p>"


body_xml = []
for text, bold, size in content:
    body_xml.append(build_paragraph(text, bold=bold, size=size))

sect = (
    "<w:sectPr>"
    "<w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
    "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" "
    "w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>"
    "</w:sectPr>"
)

document_xml = (
    "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
    "<w:document xmlns:wpc=\"http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas\" "
    "xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" "
    "xmlns:o=\"urn:schemas-microsoft-com:office:office\" "
    "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" "
    "xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" "
    "xmlns:v=\"urn:schemas-microsoft-com:vml\" "
    "xmlns:wp14=\"http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing\" "
    "xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\" "
    "xmlns:w10=\"urn:schemas-microsoft-com:office:word\" "
    "xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" "
    "xmlns:w14=\"http://schemas.microsoft.com/office/word/2010/wordml\" "
    "xmlns:wpg=\"http://schemas.microsoft.com/office/word/2010/wordprocessingGroup\" "
    "xmlns:wpi=\"http://schemas.microsoft.com/office/word/2010/wordprocessingInk\" "
    "xmlns:wne=\"http://schemas.microsoft.com/office/word/2006/wordml\" "
    "xmlns:wps=\"http://schemas.microsoft.com/office/word/2010/wordprocessingShape\" "
    "mc:Ignorable=\"w14 wp14\">"
    "<w:body>"
    + "".join(body_xml)
    + sect
    + "</w:body></w:document>"
)

content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"""

rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""

word_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>
"""

with zipfile.ZipFile(OUT_FILE, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("[Content_Types].xml", content_types_xml)
    zf.writestr("_rels/.rels", rels_xml)
    zf.writestr("word/document.xml", document_xml)
    zf.writestr("word/_rels/document.xml.rels", word_rels_xml)

print(OUT_FILE)
print(f"Total test cases: {len(cases)}")
