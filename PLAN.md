# Mini MERN E-commerce — Project Plan

> Status: implemented (local development)
>
> Stack: MongoDB · Express · React · Node.js
>
> Currency: INR
>
> Delivery target: local development only

---

## Locked decisions

| Decision | Choice |
|---|---|
| Payments | Cash on Delivery + Razorpay Standard Checkout (test mode) for UPI/cards, INR |
| Language | TypeScript (strict, client + server) |
| Admin | Minimal full admin panel |
| Product images | URL field + Unsplash seed images |
| Delivery | Local-only; no hosting |
| Database | Local MongoDB 8 via Docker Compose (Atlas optional) |
| Auth | JWT in an httpOnly cookie |
| Styling | Tailwind CSS 4 |

**Razorpay verdict:** it is still simple enough **if** we keep it contained. No webhooks, no saved cards, no payment links, no partial refunds, no live mode. We add server-created Razorpay orders, signature verification, a 15-minute stock reservation, and refund-on-cancel. Budget roughly **1–1.5 days**. We build COD first, so if Razorpay slips, the store is still fully functional.

---

## Table of contents

1. [Scope](#1-scope)
2. [Research reference](#2-research-reference)
3. [Stack](#3-stack)
4. [Architecture](#4-architecture)
5. [Payment and order lifecycle](#5-payment-and-order-lifecycle)
6. [Data models](#6-data-models)
7. [API surface](#7-api-surface)
8. [TypeScript setup](#8-typescript-setup)
9. [Frontend routes and behaviour](#9-frontend-routes-and-behaviour)
10. [Project structure](#10-project-structure)
11. [Local setup](#11-local-setup)
12. [Milestones](#12-milestones)
13. [Acceptance criteria](#13-acceptance-criteria)
14. [Deliberate boundaries](#14-deliberate-boundaries)
15. [Next step](#15-next-step)

---

## 1. Scope

### Included

- Product grid with search, category filter, sort, pagination
- Product detail, guest cart, quantity controls, cart persistence
- Register/login/logout, user/admin roles, protected routes
- COD checkout
- Razorpay test-mode checkout for UPI/cards
- Shipping form, order confirmation, my orders, order detail
- Cancel pending orders and restore stock
- Admin dashboard, product CRUD, all orders, status transitions
- Seed script, README, responsive UI, loading/empty/error states
- Basic security: bcrypt, Zod, httpOnly cookies, rate limiting, Helmet, role checks

### Excluded

- Coupons, reviews, wishlist, saved addresses, user management
- Product variants, multiple images, category CRUD
- Email verification, password reset, OAuth
- Webhooks, saved cards, partial refunds, invoices, live Razorpay mode
- Redis, Cloudinary, file uploads, dark mode, i18n
- Deployment, CORS setup, production static serving
- Automated E2E tests (typecheck, lint, and a manual QA checklist instead)

**Scope rule:** every included flow must work end-to-end against the real API and database, including permission checks, stock changes, and failure cases.

---

## 2. Research reference

| Project | Borrow | Skip |
|---|---|---|
| [ProShop](https://github.com/bradtraversy/proshop_mern) | User/Product/Order models, API shape, seed script, admin CRUD | PayPal, reviews, Redux, user management |
| [burakorkmez/mern-ecommerce](https://github.com/burakorkmez/mern-ecommerce) | Admin layout, order/category patterns, security checklist | Redis, Stripe, coupons, Cloudinary, refresh tokens |
| [RishiBakshii/mern-ecommerce](https://github.com/RishiBakshii/mern-ecommerce) | Product card/detail layout, admin tables, loading/empty states | Redux, MUI, reviews, wishlist |
| [Ekart-Project](https://github.com/Shazan99v/Ekart-Project) | Client/server split and minimal feature set | Multer uploads, weak validation |

**Common gap:** most “mini” MERN stores skip server-side price and stock validation. This plan treats the server as authoritative.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 24 |
| Frontend | React 19 + Vite 8 |
| Language | TypeScript 7 (Vite React-TS template) |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 + `@tailwindcss/vite` |
| HTTP | Axios |
| UI extras | `lucide-react`, `react-hot-toast` |
| Backend | Express 5 |
| Database | MongoDB 8 + Mongoose 9 |
| Validation | Zod 4 |
| Auth | `jsonwebtoken`, `bcryptjs`, `cookie-parser` |
| Payments | `razorpay` Node SDK + Razorpay Checkout script |
| Security | `helmet`, `express-rate-limit` |
| Dev runner | `tsx` for the server |
| Lint | oxlint (Vite 8 default; avoids the TypeScript 7 / typescript-eslint gap) |
| Monorepo | npm workspaces + `concurrently` |

### TypeScript notes

- TypeScript 7 is the current Vite template baseline. `typescript-eslint` does not support TS 7 yet, so use oxlint.
- The Razorpay Node SDK ships its own typings; `@types/razorpay` does not exist.
- `bcryptjs` v3 ships its own types.
- If any type package lags behind TS 7, pin TypeScript 6.0.3 without changing application code.

---

## 4. Architecture

```text
Development only:

React (Vite :5173) ── /api ──▶ Vite proxy ──▶ Express (:5000) ──▶ MongoDB (:27017)
                                                    │
                                                    └──▶ Razorpay test API (server-side)

Browser ──▶ Razorpay Checkout modal (checkout.razorpay.com)
```

- Vite proxies `/api` to Express, so browser requests are same-origin.
- No CORS setup and no cross-site cookie problems.
- No production static-serving layer; local development uses the Vite server.
- Razorpay key secret stays on the server. Only the public key ID reaches the browser.

---

## 5. Payment and order lifecycle

### COD flow

```text
POST /api/orders (paymentMethod: "COD")
  → validate cart + address
  → atomically decrement stock
  → create Order(status: "pending", paymentStatus: "cod")
  → return order
```

### Razorpay flow

```text
1. POST /api/orders (paymentMethod: "RAZORPAY")
   → validate cart + address
   → atomically decrement stock
   → create Order(status: "pending_payment", paymentStatus: "pending",
                  paymentExpiresAt: now + 15 minutes)
   → create Razorpay order (amount in paise, receipt = order id)
   → save razorpayOrderId
   → return { order, keyId, razorpayOrderId, amount, currency }

2. Client opens Razorpay Checkout with the returned values.

3. Payment success
   POST /api/orders/:id/verify-payment
   → verify HMAC SHA256 of `${razorpay_order_id}|${razorpay_payment_id}`
   → timing-safe comparison
   → verify the Razorpay order id matches this DB order
   → mark paymentStatus: "paid", status: "pending", store payment id

4. User dismisses/fails the modal
   POST /api/orders/:id/cancel-payment
   → cancel the pending_payment order and restore stock

5. Abandoned payment
   Cleanup job every 5 minutes
   → cancel orders with status "pending_payment" and expired paymentExpiresAt
   → restore stock once

6. Cancelling a paid online order
   → refund the full amount through Razorpay
   → then mark cancelled/refunded and restore stock
```

### Order state machine

```text
pending_payment ──payment verified──▶ pending ──ship──▶ shipped ──deliver──▶ delivered
        │                                │
        └──expire / cancel payment──▶ cancelled ◀──cancel──┘
                                      (restock; refund if paid online)
```

- Only `pending` orders can be cancelled by a customer.
- Admin transitions: `pending → shipped`, `pending → cancelled`, `shipped → delivered`.
- No backward transitions.
- `pending_payment` orders cannot be shipped or manually cancelled by an admin; the cleanup job handles them.
- All transitions are validated on the server.

### Payment status

```text
cod | pending | paid | failed | refunded
```

- COD orders use `cod`.
- Razorpay orders start `pending`, become `paid` after verification, and become `refunded` after a successful refund.
- Expired/cancelled unpaid orders use `failed`.

### Stock rules

1. Validate every item and quantity before creating an order.
2. Atomically decrement each product:
   `findOneAndUpdate({ _id, stock: { $gte: qty } }, { $inc: { stock: -qty } })`
3. If any item fails, roll back previous decrements.
4. Create the order from the updated product snapshots.
5. If order or Razorpay creation fails, restore all decrements.
6. Restore stock exactly once on cancellation using an atomic status transition and a `stockRestored` flag.
7. For paid online orders, refund **before** cancelling/restocking. If the refund fails, leave the order pending and return an error.
8. If a valid payment verification arrives after an order expired, issue an automatic refund instead of fulfilling it.

No MongoDB transactions: atomic per-item updates plus compensation are enough for this scale and avoid requiring a replica set.

### Razorpay boundaries

- Use **test-mode keys only** (`rzp_test_...`); no real money.
- No webhooks; local-only development and the verification endpoint cover the happy path.
- If the browser closes after paying but before verification, the cleanup job cannot know about the captured payment. This is an accepted test-mode limitation; production would add a webhook or a Razorpay reconciliation check.
- Refunds are full refunds only, made through the Razorpay test API.
- If keys are missing, the Razorpay option is hidden and COD remains fully functional.

---

## 6. Data models

### User

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, 2–60 chars |
| `email` | String | required, unique, lowercase, valid |
| `password` | String | required, min 8, bcrypt hash, `select: false` |
| `role` | String | `user` / `admin`; registration always creates `user` |
| timestamps | Date | createdAt, updatedAt |

### Product

| Field | Type | Rules |
|---|---|---|
| `name` | String | required, 2–100 chars |
| `description` | String | required, 10–2000 chars |
| `price` | Number | required, ≥ 1 INR, 2-decimal rounding |
| `image` | String | required, valid URL |
| `category` | String | Electronics, Apparel, Home, Accessories, Books |
| `stock` | Number | integer ≥ 0 |
| `featured` | Boolean | default false |
| timestamps | Date | createdAt, updatedAt |

Indexes: `category`, `createdAt`, `price`.

### Order

| Field | Type | Rules |
|---|---|---|
| `user` | ObjectId → User | required |
| `items` | Array | `{ product, name, image, price, qty }` snapshot |
| `shippingAddress` | Object | `fullName`, `phone`, `address`, `city`, `postalCode` |
| `itemsPrice` | Number | computed server-side |
| `totalPrice` | Number | computed server-side |
| `status` | String | `pending_payment`, `pending`, `shipped`, `delivered`, `cancelled` |
| `paymentMethod` | String | `COD`, `RAZORPAY` |
| `paymentStatus` | String | `cod`, `pending`, `paid`, `failed`, `refunded` |
| `razorpayOrderId` | String? | Razorpay order id |
| `razorpayPaymentId` | String? | Razorpay payment id |
| `razorpayRefundId` | String? | Razorpay refund id |
| `paymentExpiresAt` | Date? | 15-minute reservation deadline |
| `paidAt` | Date? | Payment verification time |
| `refundedAt` | Date? | Refund time |
| `stockRestored` | Boolean | default false; prevents double restock |
| timestamps | Date | createdAt, updatedAt |

Indexes: `{ user: 1, createdAt: -1 }`, `{ status: 1, createdAt: -1 }`, `{ razorpayOrderId: 1 }`.

Product name, image, and price are snapshotted into the order, so later edits or deletes do not change order history.

---

## 7. API surface

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Local health check |
| GET | `/api/config` | Public | Currency, Razorpay enabled flag, public key ID |
| POST | `/api/auth/register` | Public | Create account, set cookie |
| POST | `/api/auth/login` | Public | Authenticate, set cookie |
| POST | `/api/auth/logout` | Public | Clear cookie |
| GET | `/api/auth/me` | User | Hydrate session |
| GET | `/api/products` | Public | Search/filter/sort/paginate |
| GET | `/api/products/:id` | Public | Product detail |
| POST | `/api/orders` | User | Create COD or Razorpay reservation order |
| POST | `/api/orders/:id/verify-payment` | Owner | Verify Razorpay signature, mark paid |
| POST | `/api/orders/:id/cancel-payment` | Owner | Cancel unpaid online order, restock |
| GET | `/api/orders/mine` | User | Current user’s orders |
| GET | `/api/orders/:id` | Owner/Admin | Order detail |
| PATCH | `/api/orders/:id/cancel` | Owner | Cancel pending order; refund if paid online |
| GET | `/api/admin/stats` | Admin | Dashboard metrics |
| GET | `/api/admin/orders` | Admin | All orders, status filter, pagination |
| PATCH | `/api/admin/orders/:id/status` | Admin | Validated status transition, refund on cancel |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |

### Rules

- Errors: `{ message, errors?: { field: string } }` with correct status codes.
- Zod validates auth, products, orders, shipping address, and query params.
- Order totals and prices are never accepted from the client.
- Only the order owner or an admin can read an order.
- Admin routes require `role === 'admin'` on the server, not just in the UI.
- Registration never accepts a `role` field.
- Product deletion is allowed; historical orders survive via snapshots.
- Auth routes are rate-limited. Payment endpoints require authentication and order ownership.

---

## 8. TypeScript setup

```ts
// client/src/types/index.ts — DTOs mirroring the API
type Category = 'Electronics' | 'Apparel' | 'Home' | 'Accessories' | 'Books';
type OrderStatus = 'pending_payment' | 'pending' | 'shipped' | 'delivered' | 'cancelled';
type PaymentMethod = 'COD' | 'RAZORPAY';
type PaymentStatus = 'cod' | 'pending' | 'paid' | 'failed' | 'refunded';
```

- **Strict mode** on both sides. No `any`; use `unknown` with type guards.
- No TypeScript `enum`; use `as const` arrays and union types, which are erasable and work with the Vite template.
- Server: `tsx watch src/server.ts` for dev; `tsc --noEmit` for type checking.
- Client: Vite React-TS template; `tsc -b` for type checking; oxlint for linting.
- Server tsconfig: `module: ESNext`, `moduleResolution: Bundler`, `noEmit: true`, `strict: true`, `verbatimModuleSyntax: true`.
- Mongoose models use explicit interfaces and `HydratedDocument` types.
- Zod schemas infer request body types.
- `server/src/types/express.d.ts` augments `Request` with `user`.
- `client/src/types/razorpay.d.ts` declares the Razorpay Checkout window API.
- `client/src/hooks/useRazorpay.ts` loads `checkout.razorpay.com/v1/checkout.js` once and wraps the modal in a promise.
- No shared types package in v1; with only three entities, duplicating client DTOs is simpler than another workspace. The API is the contract.

### Root scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs server + client together |
| `npm run dev:server` | `tsx watch` only |
| `npm run dev:client` | Vite only |
| `npm run seed` | Wipes dev data and seeds users/products |
| `npm run db:up` | Starts local MongoDB container |
| `npm run db:down` | Stops MongoDB |
| `npm run db:reset` | Deletes the volume and starts MongoDB fresh |
| `npm run typecheck` | Server `tsc --noEmit` + client `tsc -b` |
| `npm run lint` | oxlint on client and server |
| `npm run build` | Client production build check |

---

## 9. Frontend routes and behaviour

| Route | Page | Access | Behaviour |
|---|---|---|---|
| `/` | Shop | Public | Hero, search, categories, sort, grid, pagination |
| `/products/:id` | Product Detail | Public | Image, price, stock, qty, add to cart |
| `/cart` | Cart | Public | Qty controls, remove, subtotal, checkout CTA |
| `/checkout` | Checkout | User | Address form, payment selector, order summary |
| `/login` | Login | Guest | Returns to intended page after login |
| `/register` | Register | Guest | Creates account and logs in |
| `/orders` | My Orders | User | Payment/status badges, links to detail |
| `/orders/:id` | Order Detail | Owner/Admin | Items, address, totals, cancel or admin actions |
| `/admin` | Dashboard | Admin | Stats cards + recent orders |
| `/admin/products` | Products | Admin | Search, table, add/edit/delete |
| `/admin/products/new` | Product Form | Admin | Create with image preview |
| `/admin/products/:id/edit` | Product Form | Admin | Edit product |
| `/admin/orders` | Orders | Admin | Filter, payment/status badges, detail links |
| `*` | 404 | Public | Not found |

### Key UI details

- Checkout payment selector shows **COD** and **UPI / Card (Razorpay)** only when `/api/config` says Razorpay is enabled.
- Razorpay selection opens the Checkout modal, shows a “Test mode” note, and disables the place-order button while processing.
- On modal dismiss/failure, the client calls `cancel-payment` and restores the stock reservation.
- Order lists show separate **payment** and **order status** badges.
- Admin cancellation of a paid online order asks for confirmation and states that a Razorpay refund will be issued.
- Cancel buttons are hidden for shipped/delivered orders.
- Auth context hydrates via `/auth/me`; route guards wait for hydration.
- Cart lives in `localStorage` and caps quantities at known stock.
- No Redux or React Query; auth/cart are the only global state.
- Tailwind design: zinc neutrals, emerald accent, bordered cards, `max-w-6xl`, responsive product grid, Lucide icons, toasts, skeleton loaders, accessible labels.

---

## 10. Project structure

```text
Mern_Ecom/
├─ client/
│  ├─ src/
│  │  ├─ api/client.ts
│  │  ├─ components/
│  │  │  ├─ layout/ (Header, Footer, Layout)
│  │  │  ├─ product/ (ProductCard, ProductGrid, ProductFilters, Pagination)
│  │  │  ├─ checkout/ (PaymentMethodSelector)
│  │  │  ├─ ui/ (Button, Input, Badge, Spinner, EmptyState, QuantityStepper, Price)
│  │  │  └─ routes/ (ProtectedRoute, AdminRoute)
│  │  ├─ context/ (AuthContext, CartContext)
│  │  ├─ hooks/useRazorpay.ts
│  │  ├─ pages/
│  │  │  ├─ Shop.tsx, ProductDetail.tsx, Cart.tsx, Checkout.tsx
│  │  │  ├─ Login.tsx, Register.tsx, Orders.tsx, OrderDetail.tsx, NotFound.tsx
│  │  │  └─ admin/ (Dashboard.tsx, Products.tsx, ProductForm.tsx, Orders.tsx)
│  │  ├─ types/ (index.ts, razorpay.d.ts)
│  │  ├─ utils/ (format.ts, constants.ts, errors.ts)
│  │  ├─ App.tsx, main.tsx, index.css
│  ├─ index.html
│  ├─ vite.config.ts
│  └─ package.json
├─ server/
│  ├─ src/
│  │  ├─ config/ (db.ts, env.ts)
│  │  ├─ models/ (User.ts, Product.ts, Order.ts)
│  │  ├─ controllers/ (auth, product, order, admin, config)
│  │  ├─ services/ (order.service.ts, razorpay.service.ts, cleanup.service.ts)
│  │  ├─ routes/ (auth, product, order, admin, config)
│  │  ├─ middleware/ (auth.ts, validate.ts, error.ts, rateLimit.ts)
│  │  ├─ validators/ (auth.ts, product.ts, order.ts)
│  │  ├─ utils/ (ApiError.ts, token.ts, constants.ts)
│  │  ├─ types/express.d.ts
│  │  ├─ seed.ts, app.ts, server.ts
│  ├─ .env.example
│  └─ package.json
├─ docker-compose.yml
├─ package.json
├─ .gitignore
└─ README.md
```

---

## 11. Local setup

### Database

- Docker is installed but not currently running; start Docker Desktop first.
- `docker-compose.yml` runs `mongo:8` on `127.0.0.1:27017` with a named volume.
- Root scripts: `db:up`, `db:down`, `db:reset`.
- Atlas remains an alternative by changing `MONGO_URI`; the README will document both.

### Environment

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mern_ecom
JWT_SECRET=<random 32-byte hex>

# Optional; if missing, the Razorpay option is hidden
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Razorpay test setup

- Create a free Razorpay account and switch the dashboard to **Test Mode**.
- Generate test API keys; no KYC is required for test mode.
- Use UPI `success@razorpay` / `failure@razorpay`, or test card `4111 1111 1111 1111` with any CVV and a future expiry.
- Enable auto-capture for test payments so they reach `captured` status.
- No public URL, tunnel, or webhook is needed.
- Without keys, checkout shows COD only.

### Commands

```bash
# Start Docker Desktop first
npm.cmd install
npm.cmd run db:up
npm.cmd run seed
npm.cmd run dev
```

`npm.cmd` is used on this machine because `npm.ps1` is blocked by PowerShell execution policy.

### Seed content

- 18 products across 5 categories; varied stock; stable Unsplash URLs
- Admin: `admin@store.test` / `Admin@12345`
- Demo customer: `demo@store.test` / `Demo@12345`
- Seed refuses `NODE_ENV=production` unless explicitly forced; it wipes dev collections for predictable re-seeding

---

## 12. Milestones

| # | Phase | Deliverable | Done when |
|---|---|---|---|
| 0 | Scaffold | Workspaces, Vite + Tailwind, Express + TS, Docker Mongo, env | Both apps start and connect to Mongo |
| 1 | Backend core | Env validation, DB, models, error handling, health | `/api/health` works; clean 404/500 responses |
| 2 | Auth | Register/login/logout/me, cookie, role middleware | Session persists; admin API rejects users |
| 3 | Catalog | Product APIs, Zod validation, seed script | Search/filter/sort/detail work against seed data |
| 4 | COD orders | Order creation, stock decrement/rollback, cancel, admin APIs | Stock stays correct; transitions enforced |
| 5 | Frontend shell | Layout, routes, contexts, API client, guards | Navigation/auth hydration works |
| 6 | Storefront | Shop, detail, cart, COD checkout, auth pages, orders | Customer completes a COD purchase end-to-end |
| 7 | Admin UI | Dashboard, product CRUD, order management | Admin can operate the store without touching the DB |
| 8 | Razorpay | Reservation orders, checkout modal, signature verify, cleanup, refunds | UPI test payment succeeds; cancel/refund/restock correct |
| 9 | Polish | Responsive pass, states, README, typecheck/lint | Acceptance checklist passes |

Roughly **8–9 focused days**. Phase 8 is the only optional gate; if it slips, COD remains complete.

---

## 13. Acceptance criteria

### Storefront

- [ ] Guest can browse, search, filter, sort, and paginate
- [ ] Product detail shows accurate stock and handles missing products
- [ ] Cart persists after refresh; quantities and subtotal update correctly

### Auth

- [ ] Register, login, logout, and session refresh work
- [ ] Protected routes redirect to login and return to the intended page
- [ ] Non-admin users cannot access admin pages or admin APIs

### Orders

- [ ] COD checkout validates address and stock and creates an order
- [ ] Placing an order decrements stock, clears the cart, and shows the order
- [ ] Cancelling a pending COD order restores stock
- [ ] Shipped/delivered orders cannot be cancelled
- [ ] Tampered client prices/totals are ignored
- [ ] Deleted products in an old cart fail gracefully at checkout

### Razorpay

- [ ] Without keys, checkout shows COD only
- [ ] With test keys, UPI/card payment opens Razorpay Checkout
- [ ] Successful payment verifies the signature and marks the order paid
- [ ] Tampered signature is rejected; order is not fulfilled
- [ ] Dismissing/failing checkout cancels the reservation and restores stock
- [ ] Abandoned payment expires and restocks within the cleanup interval
- [ ] Cancelling a paid online order issues a test refund before restocking
- [ ] Admin can see payment status, Razorpay payment ID, and refund ID
- [ ] Razorpay secret never appears in client code or the bundle

### Quality

- [ ] Admin product CRUD is reflected in the storefront
- [ ] Admin order status transitions are enforced server-side
- [ ] Layout works at 360px, tablet, and desktop
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass
- [ ] A fresh clone can be set up using only the README

---

## 14. Deliberate boundaries

- **No Razorpay webhooks.** The verify endpoint is the happy path; expired reservations are cleaned up. Production would add `payment.captured` webhook reconciliation.
- **Test mode only.** No live keys, KYC, settlements, or live-money handling.
- **Full refunds only.** No partial refunds or refund-after-shipping.
- **No email/notifications.** Order state is visible in the app only.
- **Cart price is a snapshot.** The server revalidates at checkout and is authoritative.
- **One image per product.** URL-based, no upload service.
- **No shared types package.** Client DTOs mirror the API; server Zod schemas are the source of truth.
- **No deployment layer.** Local-only by choice. Adding a server static build, CORS, and secure cookies is a later step.
- **No automated tests.** Typecheck, lint, and the manual acceptance checklist are the v1 gates.

---

## 15. Next step

Implementation is complete. See `README.md` for setup, seed accounts, and Razorpay test instructions. Razorpay test keys are optional; without them the store runs COD-only.
