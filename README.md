# MERN Mini Store

A clean, fully functional mini e-commerce application built with the **MERN stack** and **TypeScript**. It includes a customer storefront, persistent cart, JWT authentication, Cash on Delivery checkout, optional Razorpay test-mode payments, and a minimal admin panel.

> **Local development project.** It runs entirely on your machine. No deployment configuration, live payments, email delivery, or file uploads are included.

## Features

- Product catalog with keyword search, category filter, sorting, and pagination
- Product detail pages with stock and pricing information
- Guest cart persisted in `localStorage`
- Register, login, logout, and session restore with a JWT stored in an **httpOnly cookie**
- Cash on Delivery checkout with shipping address
- Optional **Razorpay Standard Checkout** in test mode for UPI and cards
- Order history, order details, and customer cancellation for pending orders
- Atomic stock decrementing, restoration on cancellation, and cleanup of expired payments
- Admin dashboard with sales/order metrics
- Admin product CRUD
- Admin order management with status transitions and refund handling
- INR currency formatting
- Responsive UI with loading, empty, and error states
- Strict TypeScript on both client and server

## Tech Stack

| Layer | Technologies |
|---|---|
| Client | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Axios |
| Server | Node.js, Express 5, TypeScript, Mongoose 9, Zod 4 |
| Database | MongoDB 8 |
| Auth | JWT (`jsonwebtoken`), `bcryptjs`, httpOnly cookies |
| Payments | Razorpay Standard Checkout (optional, test mode) |
| Tooling | npm workspaces, tsx, oxlint, Docker Compose |

## Project Structure

```text
mern-mini-store/
├── client/                 # React storefront and admin UI
│   └── src/
│       ├── api/            # Axios client
│       ├── components/     # Layout, product, route, and UI components
│       ├── context/        # Auth and cart providers
│       ├── hooks/          # Razorpay checkout hook
│       ├── pages/          # Storefront, account, and admin pages
│       └── utils/          # Formatting, constants, errors
├── server/                 # Express API
│   └── src/
│       ├── config/         # Environment and database config
│       ├── controllers/    # Route handlers
│       ├── middleware/     # Auth, validation, errors, rate limiting
│       ├── models/         # Mongoose models
│       ├── routes/         # API routes
│       ├── services/       # Orders, Razorpay, cleanup
│       ├── validators/     # Zod schemas
│       └── seed.ts         # Demo data seeder
├── docker-compose.yml      # Local MongoDB service
├── package.json            # Workspace scripts
└── README.md
```

## Prerequisites

- **Node.js 20.19+** (Node.js 24 LTS recommended)
- **npm 10+**
- **Docker Desktop** with Docker Compose, *or* an existing MongoDB 8 instance
- Git

> **Windows PowerShell users:** if `npm` is blocked by the execution policy (`npm.ps1 cannot be loaded`), use `npm.cmd` instead, for example `npm.cmd install` and `npm.cmd run dev`. The same applies to every npm command below.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Macmill-340/mern-mini-store.git
cd mern-mini-store
```

### 2. Install dependencies

Run from the repository root:

```bash
npm install
```

On Windows PowerShell:

```powershell
npm.cmd install
```

### 3. Create the environment file

**Windows (Command Prompt or PowerShell):**

```powershell
copy server\.env.example server\.env
```

**macOS / Linux:**

```bash
cp server/.env.example server/.env
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `server/.env` and set `JWT_SECRET` to the generated value:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mern_ecom
JWT_SECRET=paste-the-generated-secret-here

# Optional: leave both empty for COD-only checkout
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

> `JWT_SECRET` must be at least 32 characters. Never commit `server/.env`; it is already excluded by `.gitignore`.

### 4. Start MongoDB

The included Docker Compose file starts MongoDB 8 on `127.0.0.1:27017`:

```bash
npm run db:up
```

Verify it is running:

```bash
docker compose ps
```

**Using an existing MongoDB instead?** Skip `db:up` and set `MONGO_URI` in `server/.env` to your connection string. For MongoDB Atlas, use your `mongodb+srv://...` URI and allow your IP address in Atlas.

### 5. Seed demo data

```bash
npm run seed
```

This creates 18 products, an admin account, and a demo customer.

> **Warning:** seeding deletes all existing users, products, and orders in the configured database.

### 6. Run the app

```bash
npm run dev
```

This starts both processes:

| Service | URL |
|---|---|
| Storefront | http://localhost:5173 |
| API | http://localhost:5000 |
| API health check | http://localhost:5000/api/health |
| Admin panel | http://localhost:5173/admin |

The Vite dev server proxies `/api` requests to the Express server on port `5000`.

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@store.test` | `Admin@12345` |
| Customer | `demo@store.test` | `Demo@12345` |

These are local demo credentials only. Do not reuse them in a real deployment.

## Using the App

### Customer flow

1. Browse products on the home page. Use search, category filters, sorting, and pagination.
2. Open a product to view details and add it to the cart.
3. The cart persists across reloads. Adjust quantities or remove items.
4. Log in or register to continue. Guests are redirected to login at checkout.
5. Enter a shipping address and choose a payment method.
6. View orders and their statuses under **Orders**. Pending orders can be cancelled; stock is restored automatically.
7. After delivery, the order remains available in order history with its final status.

### Admin flow

1. Sign in at http://localhost:5173/login with the admin account.
2. Open http://localhost:5173/admin.
3. Use **Dashboard** for product, order, and revenue summaries.
4. Use **Products** to create, edit, and delete products. Product images are referenced by URL.
5. Use **Orders** to filter orders and advance them through:
   - `pending` → `shipped` → `delivered`
   - `pending` → `cancelled`

Cancelling a pending Razorpay order attempts an automatic refund. Orders cannot be cancelled after they are shipped.

### Order and payment states

| State | Meaning |
|---|---|
| `pending_payment` | Razorpay order created; awaiting payment |
| `pending` | COD order placed or Razorpay payment confirmed |
| `shipped` | Admin has dispatched the order |
| `delivered` | Order completed |
| `cancelled` | Order cancelled; stock restored |

Razorpay payments reserve stock for **15 minutes**. Unpaid reservations are cancelled and restocked by a background cleanup job every 5 minutes. If a payment succeeds after expiry, the app attempts an automatic refund.

## Environment Variables

All variables live in `server/.env`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Defaults to `5000`. |
| `NODE_ENV` | No | `development`, `test`, or `production`. Defaults to `development`. |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | JWT signing secret, minimum 32 characters. |
| `RAZORPAY_KEY_ID` | No | Razorpay test key ID. Enables Razorpay when paired with the secret. |
| `RAZORPAY_KEY_SECRET` | No | Razorpay test key secret. |

Changes to `server/.env` require restarting the server.

## Optional: Razorpay Test-Mode Checkout

COD works out of the box. Razorpay is enabled only when **both** keys are present. When they are empty, the checkout page offers COD only.

1. Create a [Razorpay](https://razorpay.com/) account and switch the dashboard to **Test Mode**.
2. Generate test API keys under **Account & Settings → API Keys**.
3. Add both keys to `server/.env`:

   ```dotenv
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. Enable **auto-capture** for payments in the Razorpay dashboard.
5. Restart `npm run dev`.
6. At checkout, choose Razorpay and complete the test payment in the popup.

No public URL, webhook, or ngrok tunnel is required. Payment signatures are verified on the server.

### Test payment methods

- **UPI success:** `success@razorpay`
- **UPI failure:** `failure@razorpay`
- **Card:** `4111 1111 1111 1111`, any future expiry, any CVV

> Razorpay integration is for **test mode only**. Do not use live keys with this local demo project.

## Available Scripts

Run these from the repository root. On Windows PowerShell, use `npm.cmd run <script>`.

| Script | Description |
|---|---|
| `npm run dev` | Start the API and client together |
| `npm run dev:server` | Start only the API with watch mode |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run seed` | Reset and seed demo products and users |
| `npm run db:up` | Start MongoDB with Docker Compose |
| `npm run db:down` | Stop MongoDB |
| `npm run db:reset` | Delete the MongoDB volume and recreate the container |
| `npm run typecheck` | Type-check server and client |
| `npm run lint` | Lint server and client with oxlint |
| `npm run build` | Build the client for production |

## API Overview

All endpoints are prefixed with `/api`. Authentication uses the httpOnly `token` cookie.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Health check |
| `GET` | `/config` | Public | Currency and Razorpay availability |
| `POST` | `/auth/register` | Public | Create a customer account |
| `POST` | `/auth/login` | Public | Log in and set the auth cookie |
| `POST` | `/auth/logout` | Public | Clear the auth cookie |
| `GET` | `/auth/me` | User | Current session user |
| `GET` | `/products` | Public | List products with search/filter/sort/pagination |
| `GET` | `/products/:id` | Public | Product details |
| `POST` | `/orders` | User | Create a COD or Razorpay order |
| `GET` | `/orders/mine` | User | Current user's orders |
| `GET` | `/orders/:id` | User | Order details |
| `POST` | `/orders/:id/verify-payment` | User | Verify Razorpay signature |
| `POST` | `/orders/:id/cancel-payment` | User | Cancel an unpaid Razorpay order |
| `PATCH` | `/orders/:id/cancel` | User | Cancel a pending order |
| `GET` | `/admin/stats` | Admin | Dashboard metrics |
| `GET` | `/admin/products` | Admin | List all products |
| `POST` | `/admin/products` | Admin | Create a product |
| `PUT` | `/admin/products/:id` | Admin | Update a product |
| `DELETE` | `/admin/products/:id` | Admin | Delete a product |
| `GET` | `/admin/orders` | Admin | List and filter orders |
| `PATCH` | `/admin/orders/:id/status` | Admin | Update order status |

## Security Notes

- JWTs are stored in httpOnly, SameSite=Lax cookies, not in localStorage.
- Passwords are hashed with bcrypt.
- Prices and totals are recalculated on the server; client-provided prices are never trusted.
- Request bodies and query parameters are validated with Zod.
- Auth endpoints are rate-limited.
- Helmet sets security-related HTTP headers.
- Razorpay payment signatures are verified server-side before an order is marked paid.
- `server/.env` and `node_modules/` are ignored by Git.

## Troubleshooting

### `npm.ps1 cannot be loaded` on Windows

PowerShell's execution policy is blocking `npm.ps1`. Use `npm.cmd` for every command:

```powershell
npm.cmd install
npm.cmd run dev
```

### `ECONNREFUSED 127.0.0.1:27017`

MongoDB is not running or the URI is wrong.

```bash
npm run db:up
docker compose ps
```

Make sure Docker Desktop is running, or update `MONGO_URI` to your MongoDB instance.

### `Invalid environment variables`

Check that `server/.env` exists, `MONGO_URI` is set, and `JWT_SECRET` is at least 32 characters.

### Port `5000` or `5173` is already in use

Stop the process using that port, then restart. On Windows:

```powershell
netstat -ano | findstr :5000
```

If you change the API port, also update the Vite proxy target in `client/vite.config.ts`.

### Razorpay is not shown at checkout

Both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must be set in `server/.env`, and the server must be restarted. If either key is missing, the app correctly falls back to COD-only.

### Reset all local data

```bash
npm run db:reset
npm run seed
```

This removes the Docker MongoDB volume and recreates the demo database.

## Scope and Limitations

- Local development only; no production deployment, reverse proxy, or TLS setup.
- Razorpay is test-mode only and requires your own test API keys.
- No webhooks; payment confirmation happens when the checkout popup returns and the signature is verified.
- No email notifications, invoice generation, image uploads, or reviews.
- Product images are external URLs.

## License

MIT
