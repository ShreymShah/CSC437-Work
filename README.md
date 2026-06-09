# AlgoTrader: CSC 437 Final Project

AlgoTrader is a client-rendered single-page application for browsing, creating, and
editing algorithmic-trading **strategies**. The browser renders all UI from JSON data
served by a REST API; the server never generates HTML. Data is persisted in a cloud
MongoDB database and access is protected by JWT-based authentication.

**Live app:** https://sshah84.csse.dev/

**Grading branch:** `main`

---

## What the app does

- **Register / Sign in** with a username and password (passwords are hashed with bcrypt).
- **View a list** of trading strategies.
- **Open a strategy** to see its components and live status as read-only stat rows.
- **Create** a new strategy and **edit** existing ones through forms.
- All strategy data is stored in MongoDB and is only reachable with a valid auth token.

### How to use it

1. Visit the deployed URL. You will be redirected to **`/login.html`** if not signed in.
2. No account yet? Click **"Register here"** to go to `/new-user.html` and create one.
3. After signing in you land on the dashboard at **`/app`**.
4. Go to **Strategies** to see the list, click a card to view details, use **Edit** to
   modify it, or **+ New Strategy** to create one.
5. Use **Sign Out** in the header to end the session.

There is no "trick" to running the app — once the server is up and connected to MongoDB,
everything works from the browser.

---

## Architecture (three-tier)

```
Browser (client)            Server (API)                 Database
─────────────────           ──────────────────           ──────────────
SPA: Lit-style custom   →   Express REST API         →   MongoDB Atlas
elements, MVU store,        /auth  (register/login)       - strategies
client-side router          /api/strategies (CRUD)        - user_credentials
                            JWT auth middleware
```

- **Client** (`packages/app`) — Renders entirely on the client using HTML Custom
  Elements, a Model-View-Update store, and a client-side router. Talks to the server
  only via `fetch` + JSON.
- **Server** (`packages/server`) — Express app exposing a REST/JSON API. Issues and
  verifies JWTs, hashes credentials, and reads/writes MongoDB via Mongoose.
- **Prototype** (`packages/proto`) — The original hand-coded HTML/CSS prototype from the
  early labs, kept for reference.

### Project layout

```
packages/
  app/      Client SPA (Vite + TypeScript)
    src/
      main.ts            App bootstrap: routes, custom-element registration, store
      model.ts           App state (Model) + init
      messages.ts        Msg types dispatched by views
      update.ts          MVU update fn + async REST effects (fetch)
      login.ts           <login-form> custom element (login + register)
      components/        <algo-header> (nav + auth state)
      views/             home, strategies (list), strategy (view/edit/new)
    index.html           SPA shell (/app routes)
    login.html           Sign-in page
    new-user.html        Registration page
    public/styles/       reset.css, tokens.css (CSS custom properties), page.css
  server/   Express API (TypeScript)
    src/
      index.ts           App entry, static hosting + SPA fallback for /app
      routes/auth.ts     POST /auth/register, POST /auth/login, JWT middleware
      routes/strategies.ts  CRUD routes (auth-protected)
      services/          strategy-svc, credential-svc, mongo connection
      models/            Strategy + Credential interfaces / schemas
  proto/    Original static HTML prototype
```

---

## REST API

All `/api/*` routes require an `Authorization: Bearer <token>` header.

| Method | Path                   | Auth | Description                       |
|--------|------------------------|------|-----------------------------------|
| POST   | `/auth/register`       | No   | Create account, returns JWT       |
| POST   | `/auth/login`          | No   | Verify credentials, returns JWT   |
| GET    | `/api/strategies`      | Yes  | List all strategies               |
| GET    | `/api/strategies/:id`  | Yes  | Get one strategy                  |
| POST   | `/api/strategies`      | Yes  | Create a strategy                 |
| PUT    | `/api/strategies/:id`  | Yes  | Update a strategy                 |
| DELETE | `/api/strategies/:id`  | Yes  | Delete a strategy                 |

---

## Running locally

Requires Node.js and access to a MongoDB database.

```bash
# from the repo root
npm install

# Terminal 1 — start the API server (watches for changes)
npm run dev --workspace=server

# Terminal 2 — start the Vite dev server (proxies /api and /auth to :3000)
npm run dev --workspace=app
```

The Vite dev server proxies `/api`, `/auth`, and `/images` to the server on port 3000
(see `packages/app/vite.config.js`).

### Environment variables

The server reads configuration from `packages/server/.env`. **This file is gitignored
and is not in the repository** — it must be copied manually to any machine that runs the
server. Required keys:

```
MONGO_USER=<atlas username>
MONGO_PWD=<atlas password>
MONGO_CLUSTER=<cluster host, e.g. xxxx.mongodb.net>
TOKEN_SECRET=<random secret used to sign JWTs>
PORT=3000            # optional, defaults to 3000
```

If `MONGO_*` vars are absent the server falls back to `mongodb://localhost:27017`.

---

## Production deployment (csse.dev)

The server can host the built client directly. Build the client, then start the server
with `STATIC` pointed at the client's `dist/` folder:

```bash
npm install
npm run build --workspace=app          # produces packages/app/dist
npm run start:app --workspace=server   # serves packages/app/dist + the API on $PORT
```

`start:app` sets `STATIC=../app/dist`, compiles the server (`tsc`), and runs
`node dist/index.js`. The server serves the SPA shell for any `/app/*` route so
client-side routing works on refresh/deep links.

For a long-running deployment, run the server under a process manager (e.g. `pm2`) behind
the existing reverse proxy. Make sure `packages/server/.env` exists on the VPS with valid
MongoDB credentials before starting.

---

## Mapping to the Student Learning Outcomes

1. **Client-rendered app, few dependencies.** The server serves only JSON; all HTML is
   rendered in the browser. Runtime deps are limited to the Lit-style rendering/store/
   router libraries — no heavy framework. Uses standard Web APIs: `Promise`, `fetch`,
   `Event`/`CustomEvent`, `history`, and a reactive store.
2. **HTML + CSS + JS, each for the right job.** HTML-first markup, advanced CSS via custom
   properties (`public/styles/tokens.css`), flex and grid layouts, and HTML Custom Elements
   with encapsulated styles via shadow DOM — not a JSX/CSS-in-JS approach.
3. **Framework concerns / conscientious dependencies.** Implements the **MVU** pattern
   (`model.ts` / `messages.ts` / `update.ts`) with functional views, and uses **client-side
   routing** (`router-switch` in `main.ts`) to switch views without page reloads — the core
   single-page-app pattern.
4. **Fluency in a framework + transferable concepts.** Built with Lit-style components and
   framework elements (store, messages/effects, reactivity, auth, routing, history) that map
   directly onto concepts in other frameworks.
5. **Client/server separation.** A REST/JSON API divides the tiers; the API is secured with
   JWT auth and bcrypt-hashed credentials; data lives in a cloud MongoDB database accessed
   only through the backend (three-tier); and the app is deployed to a public production
   environment.

---

## Security notes

- Passwords are hashed with bcrypt; only the hash is stored.
- API routes under `/api` require a valid JWT (`authenticateUser` middleware).
- Secrets live only in `packages/server/.env`, which is gitignored and never committed.
  Rotate `TOKEN_SECRET` and the MongoDB password if they were ever exposed.
