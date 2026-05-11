Here’s a full roadmap tailored to building a **real SaaS-style Subscription API** with Node, Express, MongoDB, JWT, and Stripe, from beginner to advanced, including architecture, tools, and production practices. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)

***

## 1. Foundations: Node, Express, and Project Structure

### Why this matters

- Almost every other feature (auth, payments, webhooks) depends on a clean Express setup and a sane folder structure. [dev](https://dev.to/ehtisamhaq/exploring-design-patterns-for-expressjs-projects-mvc-modular-and-more-37lf)
- Good structure makes it easier to add new modules like billing, notifications, RBAC without rewriting everything. [dev](https://dev.to/moibra/best-practices-for-structuring-an-expressjs-project-148i)

### How it applies to a Subscription API

- You’ll have modules like `auth`, `users`, `subscriptions`, `billing`, `webhooks`, `notifications`. A good structure keeps each concern isolated. [dev](https://dev.to/ehtisamhaq/exploring-design-patterns-for-expressjs-projects-mvc-modular-and-more-37lf)
- Clear separation between routes, controllers, services, and data access makes it easier to handle complex flows like “user upgrades plan and prorates subscription”. [dev](https://dev.to/ehtisamhaq/exploring-design-patterns-for-expressjs-projects-mvc-modular-and-more-37lf)

### Recommended folder structure (scalable Express app)

Use a **modular / layered architecture**:

```bash
src/
  app.js
  server.js
  config/
    env.js
    db.js
  routes/
    index.js
    auth.routes.js
    user.routes.js
    subscription.routes.js
    billing.routes.js
    webhook.routes.js
  controllers/
    auth.controller.js
    user.controller.js
    subscription.controller.js
    billing.controller.js
    webhook.controller.js
  services/
    auth.service.js
    user.service.js
    subscription.service.js
    billing.service.js
  models/
    user.model.js
    subscription.model.js
    plan.model.js
    payment.model.js
  middlewares/
    auth.middleware.js
    error.middleware.js
    validation.middleware.js
    rbac.middleware.js
  utils/
    logger.js
    apiResponse.js
    jwt.js
  tests/
    unit/
    integration/
```

This is a common pattern in production Node apps and mirrors MVC + service + repository ideas. [dev](https://dev.to/moibra/best-practices-for-structuring-an-expressjs-project-148i)

### Step-by-step learning / implementation

1. Learn basic Node/Express: routing, middleware, error handling, environment variables. [sematext](https://sematext.com/blog/expressjs-best-practices/)
2. Create minimal app: `GET /health` route, centralized error handler, `NODE_ENV` aware config. [runebook](https://runebook.dev/en/docs/express/advanced/best-practice-performance)
3. Introduce layered files: controllers call services; services talk to models.

### Best practices, mistakes, production considerations

- Set `NODE_ENV=production` in real deployments for better performance and less verbose errors. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)
- Centralize error handling (one error middleware) instead of scattering `try/catch` everywhere. [github](https://github.com/goldbergyoni/nodebestpractices)
- Avoid putting database logic in routes; keep it in services or repositories for testability. [github](https://github.com/goldbergyoni/nodebestpractices)

### Milestones for this stage

- [ ] Project bootstrapped with `src` structure above.
- [ ] `/health` and `/status` endpoints working.
- [ ] Global error middleware and basic logging in place.

***

## 2. MongoDB & Data Modeling for Subscriptions

### Why this matters

- Subscription systems are data-heavy: users, plans, invoices, payments, webhook events, etc.
- A good schema makes it easier to handle upgrades, downgrades, cancellations, and analytics. [stackoverflow](https://stackoverflow.com/questions/54196438/mongodb-schema-for-account-creation-with-subscription-plan)

### How it applies to a Subscription API

You’ll need at least:

- `User`: profile, auth info, current subscription reference.
- `Plan`: name, price, interval (monthly/yearly), Stripe product/price IDs.
- `Subscription`: status, current period start/end, plan, Stripe subscription ID.
- `Payment`: charge ID, amount, status, timestamps.

### Step-by-step

1. Learn basic Mongoose: schemas, models, validation, references.
2. Design schemas for `User`, `Plan`, `Subscription`, `Payment` to reflect how Stripe’s objects map to your DB. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
3. Add indexes on frequently queried fields like `userId`, `subscription.status`. [stackoverflow](https://stackoverflow.com/questions/54196438/mongodb-schema-for-account-creation-with-subscription-plan)

### Best practices, mistakes, production considerations

- Avoid pushing entire Stripe objects to Mongo; store only what your app really needs (plus Stripe IDs). [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Use enum fields for statuses (`active`, `trialing`, `canceled`) to avoid string inconsistencies. [stackoverflow](https://stackoverflow.com/questions/54196438/mongodb-schema-for-account-creation-with-subscription-plan)
- Plan for soft deletion (e.g., `isDeleted`) instead of hard deletion to preserve billing history. [github](https://github.com/goldbergyoni/nodebestpractices)

### Milestones

- [ ] MongoDB connection configured (with retry and proper URI from env).
- [ ] Core models (`User`, `Plan`, `Subscription`, `Payment`) created.
- [ ] Simple CRUD endpoints for `Plan` (admin-only later).

***

## 3. Authentication with JWT

### Why this matters

- Auth is the gateway to all subscription actions; you must reliably know who the user is.
- JWTs are common in modern APIs and integrate nicely with mobile/web frontends. [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)

### How it applies to a Subscription API

- Users must sign up, log in, and then call protected endpoints like `/subscriptions/me`, `/billing/portal`.
- JWT payload can contain `userId` and roles (`user`, `admin`) for RBAC. [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)

### Step-by-step

1. Implement signup and login using email/password and hashed passwords (e.g., bcrypt).
2. Generate short-lived access tokens and longer-lived refresh tokens. [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)
3. Implement `auth.middleware.js` to decode and verify JWT and attach `req.user`.
4. Add refresh token endpoint to rotate tokens.

### Best practices, mistakes, production considerations

- Keep access tokens short-lived (5–15 minutes) and use refresh tokens for long sessions. [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)
- Store refresh tokens securely and support revocation (e.g., token blacklist or token version). [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)
- Never store JWTs in localStorage in browser clients for highly sensitive apps; prefer HttpOnly cookies if you control the frontend. [nareshit](https://nareshit.com/blogs/jwt-authentication-in-node-js)

### Milestones

- [ ] `/auth/signup` and `/auth/login` implemented.
- [ ] Protected route `/me` that returns user profile using JWT auth middleware.
- [ ] Basic refresh token flow.

***

## 4. Authorization & RBAC (including your RBAC API)

### Why this matters

- In SaaS, not everyone should access everything: admin vs regular users, plus features gated by plan.
- RBAC keeps permissions manageable as you add more features. [github](https://github.com/goldbergyoni/nodebestpractices)

### How it applies to a Subscription API

- Admins: manage plans, see all users, etc.
- Users: manage only their own subscription.
- Plan-based permissions: e.g., free plan cannot access some endpoints.

### Step-by-step

1. Add `role` field to `User` model (e.g., `user`, `admin`).
2. Create `rbac.middleware.js` which checks `req.user.role` against allowed roles for a route.
3. Extend RBAC to plan-based checks in services or guards (e.g., `requirePlan('pro')`).

### Best practices, mistakes, production considerations

- Centralize RBAC logic in a helper or middleware; don’t inline `if (user.role === 'admin')` everywhere. [github](https://github.com/goldbergyoni/nodebestpractices)
- Always combine RBAC with ownership checks (user can only modify their own subscription).
- Log authorization failures to detect abuse patterns. [github](https://github.com/goldbergyoni/nodebestpractices)

### Milestones

- [ ] Role field added and set during user creation.
- [ ] Admin-only routes for plan management.
- [ ] Middleware-based permission checks.

***

## 5. Stripe Integration: Plans and Subscriptions

### Why this matters

- Stripe will handle actual billing, invoices, and recurring charges.
- Your backend must orchestrate creation of Stripe customers and subscriptions, and keep your DB in sync. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)

### How it applies to your Subscription API

Typical flows:

- User signs up → create Stripe customer.
- User chooses plan → create Stripe subscription (or Checkout Session) for that customer.
- On updates/cancels, Stripe sends webhooks, and your DB updates subscription status. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)

### Step-by-step

1. Create Stripe account, get API keys, install Stripe Node SDK. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
2. Create products/prices in Stripe Dashboard (or via API) matching your `Plan` model.
3. Implement endpoint `POST /billing/create-checkout-session` that:
    - Verifies authenticated user.
    - Creates Stripe Checkout Session with correct price ID and success/cancel URLs. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
4. Implement endpoint `/billing/portal` for billing portal link.
5. Save Stripe customer ID on `User` when first interacting with Stripe.

### Best practices, mistakes, production considerations

- Never expose Stripe secret keys to the frontend; they belong only on your server. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Always trust Stripe webhooks, not frontend responses, for final subscription state. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Keep Stripe IDs in your DB and your own canonical subscription model to avoid coupling everything to Stripe’s object shape. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)

### Milestones

- [ ] Users can initiate subscription purchase via a Stripe Checkout Session.
- [ ] Stripe customer IDs saved on users.
- [ ] Plans in Stripe consistent with your `Plan` model.

***

## 6. Webhooks (Stripe events) – core of subscription tracking

### Why this matters

- Stripe notifications (webhooks) are how you know if a payment succeeded, failed, subscription canceled, trial ended, etc.
- Without webhooks, your subscription states will be wrong or outdated. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)

### How it applies to a Subscription API

- Events like `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` drive changes in your `Subscription` and `Payment` collections. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)

### Step-by-step

1. Create `POST /webhooks/stripe` route that:
    - Reads raw body.
    - Verifies webhook signature using Stripe SDK and endpoint secret. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
2. Handle relevant event types and map them to DB updates, e.g.:
    - `customer.subscription.created/updated/deleted` → create/update `Subscription` doc.
    - `invoice.payment_succeeded` → create `Payment` record. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
3. Return `200` quickly; avoid long processing in the webhook handler.

### Best practices, mistakes, production considerations

- Use the raw body, not parsed JSON, when verifying Stripe signatures. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Keep webhook handlers idempotent (e.g., check if you already processed a given event ID). [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Store log of events processed for debugging and audits.

### Milestones

- [ ] Webhook endpoint working in Stripe test mode.
- [ ] Subscription status in DB updates automatically on Stripe events.
- [ ] Payment history recorded.

***

## 7. Subscription Tracking & Business Logic

### Why this matters

- This is your “domain logic”: what does “active” mean, when to block access, how to enforce plan limits.
- It’s where your app becomes a real SaaS product rather than just a payment integrator. [github](https://github.com/goldbergyoni/nodebestpractices)

### How it applies to your Subscription API

- Endpoints like `/subscriptions/me`, `/subscriptions/change-plan`, `/subscriptions/cancel`, `/subscriptions/usage`.
- Business checks: trials, grace periods, proration, usage-based limits.

### Step-by-step

1. Implement service methods to:
    - Get current subscription for a user (from DB, not from Stripe directly).
    - Check if user is allowed to access premium features.
2. Add plan-based guards in controllers or middleware.
3. Optionally implement usage tracking (e.g., API calls per month).

### Best practices, mistakes, production considerations

- Treat Stripe as the billing system of record, but use your DB as the source for authorization checks. [dev](https://dev.to/apollo_ag/how-i-built-a-stripe-webhook-in-nodejs-full-guide-3d7l)
- Keep plan capabilities in your `Plan` model (e.g., `maxProjects`, `supportsFeatureX`).
- Be explicit about edge cases like canceled but still in paid period.

### Milestones

- [ ] `/subscriptions/me` returns correct status and plan capabilities.
- [ ] Feature endpoints respect subscription status/plan.
- [ ] Clear subscription state transitions defined.

***

## 8. Notifications & Push (your “Push notification” goal)

### Why this matters

- Users expect emails or notifications about their billing status: trial ending, payment failed, plan updated.
- Good communication reduces churn and support tickets. [github](https://github.com/goldbergyoni/nodebestpractices)

### How it applies to your Subscription API

- Send emails on key events: trial expiring, payment failed, subscription canceled.
- For push notifications (e.g., to mobile), the subscription backend triggers events that other services consume.

### Step-by-step

1. Integrate an email provider (e.g., SendGrid, Mailgun) for transactional emails.
2. Create notification service which listens to business events (e.g., `SUBSCRIPTION_CANCELED`) and sends appropriate messages.
3. For push, design a simple message queue or event emitter; mobile or other services can subscribe.

### Best practices, mistakes, production considerations

- Decouple email templates and sending logic from core controllers. [github](https://github.com/goldbergyoni/nodebestpractices)
- Avoid sending emails synchronously in request handlers; use queues or background jobs if possible.
- Log all notifications for auditing.

### Milestones

- [ ] Email notifications on key subscription events.
- [ ] Notification service layer.

***

## 9. Security & Hardening

### Why this matters

- You’re handling user data and payment-related identifiers; security is critical.
- Poor security leads to breaches, fraud, and loss of trust. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)

### How it applies to a Subscription API

- Secure JWT auth, HTTPS, safe input handling, and dependency management.
- Brute-force protection on login, rate-limiting on sensitive endpoints. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)

### Step-by-step

1. Use `helmet` in Express to set secure HTTP headers. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)
2. Validate request bodies (e.g., with `joi` or `zod`) using a validation middleware.
3. Add rate limiting (e.g., `express-rate-limit`) to auth and webhook endpoints.
4. Configure TLS/HTTPS in production (through your hosting / reverse proxy). [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)

### Best practices, mistakes, production considerations

- Never trust user input; always validate and sanitize. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)
- Keep dependencies updated and use tools like `npm audit`. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)
- Use secure cookies and appropriate CORS settings if your frontend is separate. [expressjs](https://expressjs.com/en/advanced/best-practice-security.html)

### Milestones

- [ ] Helmet and validation middleware enabled.
- [ ] Rate limiting on auth/webhook routes.
- [ ] Basic security checklist for deployment.

***

## 10. Logging, Error Handling, and Monitoring

### Why this matters

- In production, you need to see what’s going wrong: failed payments, webhook errors, auth issues.
- Logging and monitoring are crucial for debugging and reliability. [sematext](https://sematext.com/blog/expressjs-best-practices/)

### How it applies to a Subscription API

- Logs for every Stripe event handled, every failed login, and every unexpected error.
- Monitoring helps catch issues like webhook failures or rising 500 error rates. [sematext](https://sematext.com/blog/expressjs-best-practices/)

### Step-by-step

1. Introduce a logging utility (e.g., `winston`, `pino`). [sematext](https://sematext.com/blog/expressjs-best-practices/)
2. Standardize log formats (level, message, context like `userId` or `subscriptionId`).
3. Hook into an external log/monitoring service (e.g., Logtail, Datadog, Sentry). [sematext](https://sematext.com/blog/expressjs-best-practices/)

### Best practices, mistakes, production considerations

- Use different log levels (info, warn, error) and avoid logging sensitive data. [github](https://github.com/goldbergyoni/nodebestpractices)
- Centralize error handling, and return consistent error response shapes to the client. [sematext](https://sematext.com/blog/expressjs-best-practices/)
- Monitor uptime and critical flows (checkout, webhooks). [sematext](https://sematext.com/blog/expressjs-best-practices/)

### Milestones

- [ ] Structured logging integrated.
- [ ] Global error handler returns consistent JSON error responses.
- [ ] Basic external monitoring connected.

***

## 11. Caching & Performance

### Why this matters

- As more users and requests come in, caching reduces load and improves response time.
- Some subscription data (like plans) rarely changes and is perfect for caching. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)

### How it applies to your Subscription API

- Cache plan list, public configuration, and maybe user subscription status for short periods.
- Cache expensive Stripe API reads when necessary. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)

### Step-by-step

1. Learn basics of in-memory caching and Redis.
2. Add simple in-memory cache for plans in dev; upgrade to Redis in production.
3. Cache read-heavy endpoints with invalidation when data changes.

### Best practices, mistakes, production considerations

- Always think about cache invalidation when data updates. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)
- Don’t cache sensitive user-specific data without considering security and staleness.
- Use TTLs (time-to-live) to avoid long-lived stale data. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)

### Milestones

- [ ] Plans endpoint cached.
- [ ] Simple Redis integration ready for production.

***

## 12. Testing (Unit, Integration, E2E)

### Why this matters

- Changes to billing logic can be expensive if they break; tests give confidence to refactor. [github](https://github.com/goldbergyoni/nodebestpractices)
- Webhook and subscription flows are complex and need coverage.

### How it applies to a Subscription API

- Tests for auth, RBAC, critical subscription flows, webhook handling, and plan-based access.
- Integration tests with Stripe test keys or mocks.

### Step-by-step

1. Choose a test framework (e.g., Jest, Mocha) and setup. [github](https://github.com/goldbergyoni/nodebestpractices)
2. Write unit tests for services (e.g., subscription status logic).
3. Write integration tests calling routes with an in-memory or test DB.
4. Add tests simulating Stripe webhook payloads.

### Best practices, mistakes, production considerations

- Test happy paths and edge cases (failed payment, canceled mid-cycle).
- Keep tests fast and deterministic; mock network requests where possible. [github](https://github.com/goldbergyoni/nodebestpractices)
- Use coverage reports to ensure critical modules are tested.

### Milestones

- [ ] Basic unit tests for auth and subscription services.
- [ ] Integration tests for key flows (subscribe, cancel, change plan).
- [ ] Webhook event tests.

***

## 13. API Documentation

### Why this matters

- A real SaaS backend must be consumable by frontends and external clients.
- Documentation reduces friction for anyone using the API. [github](https://github.com/goldbergyoni/nodebestpractices)

### How it applies to your Subscription API

- Document endpoints like `/auth`, `/subscriptions`, `/billing`, `/webhooks`.
- Include request/response examples, error codes, and auth requirements.

### Step-by-step

1. Use OpenAPI/Swagger annotations or YAML/JSON description.
2. Integrate Swagger UI with Express to serve interactive docs.
3. Keep docs updated as you add features.

### Best practices, mistakes, production considerations

- Keep a single source of truth (OpenAPI spec) and generate docs from it if possible. [github](https://github.com/goldbergyoni/nodebestpractices)
- Ensure docs clearly describe auth headers and roles required.
- Include webhook event documentation for integrators.

### Milestones

- [ ] Swagger/OpenAPI spec created.
- [ ] Docs endpoint (e.g., `/docs`) available.

***

## 14. Deployment, CI/CD, and Production Operations

### Why this matters

- A real SaaS must be deployed, updated, and rolled back reliably. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)
- CI/CD ensures consistent builds and tests before deployments.

### How it applies to your Subscription API

- You’ll deploy Node + MongoDB and integrate environment variables for Stripe keys, JWT secrets, etc.
- Each change to subscription logic should pass tests before hitting production. [github](https://github.com/goldbergyoni/nodebestpractices)

### Step-by-step

1. Choose hosting (e.g., Render, Railway, AWS, DigitalOcean).
2. Containerize app with Docker (optional but recommended).
3. Set up CI (e.g., GitHub Actions) to run tests on each push.
4. Configure CD to deploy on successful builds.

### Best practices, mistakes, production considerations

- Set `NODE_ENV=production`, enable clustering or load balancing for scalability. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)
- Keep secrets in environment variables or secret managers.
- Back up MongoDB and test restore periodically.

### Milestones

- [ ] App deployed in a staging environment.
- [ ] CI pipeline running tests on every push.
- [ ] Production deployment configured with environment-specific settings.

## Putting it all together: build order (feature-by-feature)

1. **Stage 1: Core setup**
    - Project structure, health route, Mongo connection, models.
2. **Stage 2: Auth & RBAC**
    - JWT auth, signup/login, `/me`, role-based middleware.
3. **Stage 3: Plans & Billing**
    - Plan CRUD, Stripe products/prices, checkout sessions, billing portal.
4. **Stage 4: Webhooks & Subscription Tracking**
    - Stripe webhooks, subscription and payment records, `/subscriptions/me`.
5. **Stage 5: Feature gating & Notifications**
    - Plan-based access checks, email notifications, push/event system.
6. **Stage 6: Hardening & Quality**
    - Security middleware, logging, tests, docs.
7. **Stage 7: Deployment & Monitoring**
    - CI/CD, production deployment, monitoring/alerts.

At this point you’ll have a **production-style SaaS backend** with auth, subscriptions, payments, webhooks, RBAC, and operational tooling. [expressjs](https://expressjs.com/en/advanced/best-practice-performance.html)

***

To tailor this further: what is your current level with Node/Express/Mongo (e.g., total beginner, comfortable with CRUD APIs, or already built small projects), and which stage from the roadmap would you like to start implementing first?