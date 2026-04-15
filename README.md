# Smart Supply Chain Visibility and Predictive Restocking

This project is a full-stack app with:
- React + Vite frontend
- Express API server
- Gemini-based agentic AI copilot (tool calling)
- Redis-backed sessions + chat memory
- Postgres-backed user authentication
- Postgres-backed operational data (inventory, shipments, forecasts, alerts)
- Persistent audit logs
- Docker Compose deployment (nginx + api + redis + postgres)

## 1) Local setup

1. Copy environment template:
   - `cp .env.example .env`
2. Fill required values in `.env`:
   - `GEMINI_API_KEY`
   - `SESSION_SECRET`
3. Start full stack:
   - `docker compose up -d --build`
4. Check health:
   - `curl http://localhost/api/health`

## 2) Authentication model

- Users are stored in Postgres via Prisma.
- Passwords are hashed using bcrypt.
- Sessions are stored in Redis using `express-session`.
- Open self-registration is disabled.
- Admins can create users via `POST /api/users`.
- Forgot/reset password flow is available:
  - `POST /api/forgot-password`
  - `POST /api/reset-password`
- Default seeded accounts (password from `SEED_DEFAULT_PASSWORD`):
  - `admin@smartsupply.io`
  - `viewer@smartsupply.io`

## 3) Agentic AI model

`POST /api/chat` uses Gemini with function-calling and a server tool registry:
- `get_inventory_status`
- `get_shipments`
- `get_forecast`
- `get_alerts`
- `trigger_restock` (admin-only)

Conversation memory is stored server-side in Redis per user.

## 4) Data and audit model

- Dashboard data now comes from Postgres tables:
  - `InventoryItem`
  - `Shipment`
  - `ForecastPoint`
  - `SupplyAlert`
- Security and operations are tracked in `AuditLog` and visible in the Audit Logs page (admin only).

## 5) Security controls

- Helmet headers
- Login/forgot/reset rate limiting
- CSRF token validation for authenticated mutating endpoints
- Input validation with Zod
- Structured request/tool logging with request IDs

## 6) EC2 deployment (build on instance)

Use the guide in `docs/ec2-deploy.md`.

Short version:
1. Pull latest code to EC2
2. Update `.env`
3. Run `docker compose up -d --build`
4. Verify `http://<EC2_PUBLIC_IP>/api/health`

## 7) CI/CD auto-deploy (optional)

GitHub Actions workflow is included at `.github/workflows/deploy-ec2.yml`.

Set these repository secrets:
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_PRIVATE_KEY`
- `EC2_APP_PATH` (for example `/home/ubuntu/cc_pack`)

On `main` push, workflow runs lint/build and then SSH deploys with:
- `git pull origin main`
- `docker compose up -d --build`

## 8) Development commands

- `npm run dev` - run server in development mode
- `npm run build` - build frontend assets
- `npm run lint` - TypeScript type-check
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - apply DB migrations
- `npm run prisma:seed` - seed users
