# Stripe Subscription API

A Node.js and Express API for managing user authentication, subscription plans, Stripe Checkout subscriptions, billing history, and Stripe webhook events.

This project is structured as a backend service for SaaS-style subscription products. It uses JWT authentication, role-based access control, MongoDB persistence, and Stripe for subscription billing.

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - API server framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **Stripe** - Subscription billing and checkout
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **cookie-parser** - HTTP-only auth cookie support
- **cors** - Cross-origin request handling
- **dotenv** - Environment variable loading
- **nodemon** - Local development auto-reload

## Key Features

- User registration and login
- JWT authentication with HTTP-only cookie support
- Protected user profile endpoint
- Admin-only plan creation, updates, and soft deletion
- Public plan listing and plan details
- Stripe Checkout subscription flow
- Subscription cancellation, either immediately or at period end
- Current subscription lookup
- Billing invoice history
- Stripe webhook handling for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- Centralized error middleware
- Modular route, controller, service, middleware, and model structure

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd strip-sub-api
```

### 2. Install dependencies

```bash
yarn install
```

If you prefer npm:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5500

DB_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m

CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5500

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### Environment Variable Reference

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment. Use `development` locally. |
| `PORT` | Port where the API server runs. |
| `DB_URL` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign JWT tokens. |
| `JWT_EXPIRES_IN` | JWT expiration value, such as `15m`, `1h`, or `7d`. |
| `CLIENT_URL` | Frontend app URL used for Stripe Checkout redirects. |
| `SERVER_URL` | Backend API URL. |
| `STRIPE_SECRET_KEY` | Stripe secret API key. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. |

## Running Locally

Start the development server:

```bash
yarn dev
```

Or with npm:

```bash
npm run dev
```

Start the server without auto-reload:

```bash
yarn start
```

The API will run at:

```text
http://localhost:5500
```

The root endpoint should return:

```text
Welcome To stripe subscription api
```

## Available Scripts

| Command | Description |
| --- | --- |
| `yarn start` | Runs `node app.js`. |
| `yarn dev` | Runs `nodemon app.js` for development. |
| `npm run start` | npm equivalent for production-style startup. |
| `npm run dev` | npm equivalent for development startup. |

## API Base URL

```text
http://localhost:5500/api/v1
```

For production, replace the host with your deployed API URL.

## Authentication

Protected endpoints require a valid JWT. The API supports two auth methods:

1. `Authorization` header:

```http
Authorization: Bearer <token>
```

2. HTTP-only cookie named `token`, automatically set during register and login.

Admin-only routes also require the authenticated user to have:

```json
{
  "role": "admin"
}
```

## API Endpoints

### Health Check

#### `GET /`

Returns a simple welcome message.

Example response:

```text
Welcome To stripe subscription api
```

## Auth Endpoints

### Register User

#### `POST /api/v1/auth/register`

Creates a new user, hashes the password, returns a JWT, and sets an HTTP-only auth cookie.

Request body:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

Success response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "665f1c2b9d9c7d0012345678",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "isVerified": false
    }
  }
}
```

### Login User

#### `POST /api/v1/auth/login`

Authenticates a user and returns a JWT.

Request body:

```json
{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

Success response:

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "665f1c2b9d9c7d0012345678",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "isVerified": false
    }
  }
}
```

### Get Current User

#### `GET /api/v1/auth/me`

Requires authentication.

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "665f1c2b9d9c7d0012345678",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "isVerified": false
    },
    "subscription": null
  }
}
```

### Get Current Admin

#### `GET /api/v1/auth/admin/me`

Requires authentication and `admin` role.

## Plan Endpoints

### List Plans

#### `GET /api/v1/plans`

Returns active plans by default.

Query parameters:

| Parameter | Description |
| --- | --- |
| `includeInactive=true` | Includes inactive plans in the response. |

Success response:

```json
{
  "success": true,
  "count": 1,
  "data": {
    "plans": [
      {
        "_id": "665f1f0c9d9c7d0012345678",
        "name": "Pro",
        "features": ["Unlimited projects", "Priority support"],
        "price": 29,
        "currency": "USD",
        "description": "Best for growing teams",
        "interval": "month",
        "isActive": true,
        "stripePriceId": "price_123"
      }
    ]
  }
}
```

### Get Single Plan

#### `GET /api/v1/plans/:id`

Success response:

```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "665f1f0c9d9c7d0012345678",
      "name": "Pro",
      "price": 29,
      "currency": "USD",
      "interval": "month",
      "isActive": true,
      "stripePriceId": "price_123"
    }
  }
}
```

### Create Plan

#### `POST /api/v1/plans`

Requires authentication and `admin` role.

Request body:

```json
{
  "name": "Pro",
  "features": ["Unlimited projects", "Priority support"],
  "price": 29,
  "currency": "USD",
  "description": "Best for growing teams",
  "interval": "month",
  "stripePriceId": "price_123"
}
```

Success response:

```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "plan": {
      "_id": "665f1f0c9d9c7d0012345678",
      "name": "Pro",
      "price": 29,
      "currency": "USD",
      "interval": "month",
      "isActive": true,
      "stripePriceId": "price_123"
    }
  }
}
```

### Update Plan

#### `PATCH /api/v1/plans/:id`

Requires authentication and `admin` role.

Request body:

```json
{
  "price": 39,
  "description": "Updated Pro subscription plan"
}
```

### Delete Plan

#### `DELETE /api/v1/plans/:id`

Requires authentication and `admin` role.

This performs a soft delete by setting `isActive` to `false`.

## Subscription Endpoints

### Create Stripe Checkout Session

#### `GET /api/v1/subscription/checkout/:planId`

Requires authentication.

Creates a Stripe Checkout Session for the selected plan and returns the Checkout URL.

Success response:

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### Cancel Subscription

#### `POST /api/v1/subscription/cancel`

Requires authentication.

If `immediately` is `false` or omitted, the subscription is canceled at the end of the current billing period. If `immediately` is `true`, the subscription is canceled immediately in Stripe.

Request body:

```json
{
  "immediately": false
}
```

Success response:

```json
{
  "success": true,
  "message": "subscription successfully cancelled",
  "data": {
    "_id": "665f22759d9c7d0012345678",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "canceledAt": null
  }
}
```

### Get Current Subscription

#### `GET /api/v1/subscription/current-subscription`

Requires authentication.

Success response:

```json
{
  "success": true,
  "message": "subscription successfully retrieved",
  "data": {
    "_id": "665f22759d9c7d0012345678",
    "status": "active",
    "plan": {
      "_id": "665f1f0c9d9c7d0012345678",
      "name": "Pro",
      "interval": "month"
    },
    "currentPeriodEnd": "2026-06-13T10:00:00.000Z"
  }
}
```

### Get Billing History

#### `GET /api/v1/subscription/billingHistory`

Requires authentication.

Success response:

```json
{
  "success": true,
  "message": "invoice successfully retrieved",
  "data": [
    {
      "_id": "665f23919d9c7d0012345678",
      "stripeInvoiceId": "in_123",
      "amountPaid": "29.00",
      "amountDue": "0.00",
      "currency": "usd",
      "status": "paid",
      "invoiceUrl": "https://invoice.stripe.com/...",
      "invoicePdf": "https://pay.stripe.com/invoice/..."
    }
  ]
}
```

## Webhook Endpoint

### Stripe Webhook

#### `POST /webhooks/stripe`

Receives Stripe webhook events. This endpoint uses `express.raw({ type: "application/json" })`, which is required for Stripe signature verification.

Configure this endpoint in your Stripe Dashboard or Stripe CLI:

```bash
stripe listen --forward-to localhost:5500/webhooks/stripe
```

Example success response:

```json
{
  "received": true
}
```

## Error Handling Format

The API generally returns errors in this shape:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Some controller-level errors currently use `error` instead of `message`:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common status codes:

| Status Code | Meaning |
| --- | --- |
| `400` | Bad request, validation error, duplicate record, or invalid password. |
| `401` | Missing or invalid authentication token. |
| `403` | Authenticated user does not have the required role or subscription plan. |
| `404` | Resource was not found. |
| `500` | Server error or upstream service error. |

## Project Structure

```text
strip-sub-api/
├── app.js
├── config/
│   ├── db.js
│   └── env.js
├── controllers/
│   ├── auth.controllers.js
│   ├── plan.contollers.js
│   └── subscription.controllers.js
├── middleware/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── rbac.middleware.js
├── modals/
│   ├── invoice.models.js
│   ├── plan.models.js
│   ├── subscription.models.js
│   └── users.models.js
├── routes/
│   ├── auth.route.js
│   ├── plan.route.js
│   ├── subscription.routes.js
│   └── webhook.route.js
├── service/
│   └── stripe.service.js
├── package.json
└── yarn.lock
```

### Architecture Overview

- `app.js` configures Express middleware, route mounting, webhooks, error handling, and database startup.
- `routes/` defines endpoint paths and route-level middleware.
- `controllers/` handles request and response logic.
- `service/` contains external integration logic, especially Stripe billing operations.
- `middleware/` contains authentication, authorization, plan-gating, and centralized error handling.
- `modals/` contains Mongoose schemas and models for users, plans, subscriptions, and invoices.

This separation keeps the API easier to scale: business logic can move into services, route protection stays in middleware, and database schemas remain isolated from HTTP concerns.

## Dependencies

Production dependencies:

```json
{
  "bcryptjs": "^3.0.3",
  "cookie-parser": "~1.4.4",
  "cors": "^2.8.6",
  "debug": "~2.6.9",
  "dotenv": "^17.4.2",
  "express": "^5.2.1",
  "http-errors": "~1.6.3",
  "jsonwebtoken": "^9.0.3",
  "mongodb": "^7.2.0",
  "mongoose": "^9.6.2",
  "morgan": "~1.9.1",
  "pug": "2.0.0-beta11",
  "stripe": "^22.1.1"
}
```

Development dependencies:

```json
{
  "@eslint/js": "^10.0.1",
  "eslint": "^10.3.0",
  "nodemon": "^3.1.14"
}
```

## Testing

There is currently no automated test script configured in `package.json`.

Recommended future test setup:

- Use **Jest** or **Vitest** for unit tests.
- Use **Supertest** for API endpoint tests.
- Use a separate MongoDB test database.
- Mock Stripe service calls for predictable subscription tests.

Manual testing can be done with Postman, Insomnia, cURL, or Thunder Client.

Example cURL request:

```bash
curl -X POST http://localhost:5500/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"securePassword123"}'
```

## Contribution Guidelines

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

3. Install dependencies and run the project locally.
4. Keep changes focused and consistent with the existing structure.
5. Add or update documentation when behavior changes.
6. Open a pull request with a clear description of the change.

## License

No license file is currently included in this repository.

If this is intended to be open source, consider adding an MIT License:

```text
MIT License
Copyright (c) 2026 <Your Name>
```

