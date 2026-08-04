# SCE Web — Frontend

Next.js frontend for the Sagitta Continuity Engine portal.

## Stack

| | |
|---|---|
| Framework | Next.js 16.2 (webpack) |
| UI | React 19 |
| Styling | Tailwind CSS v4 + PostCSS |
| Language | TypeScript 5 (strict) |
| Icons | Lucide React |

## Getting started

```bash
# from apps/web
npm install
npm run dev        # http://localhost:3000
```

The API must be running at `http://127.0.0.1:8000`. See `apps/api/README.md` to start it.

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Marketing home
│   ├── login/                  # Email login
│   ├── request-access/         # Self-service signup form
│   ├── terms/                  # Terms of service
│   ├── privacy/                # Privacy policy
│   ├── status/                 # System status
│   ├── resources/              # Public resources
│   ├── decisions/              # Doctrine decisions (public)
│   ├── monitors/
│   │   ├── status/             # Monitor status
│   │   └── tick/               # Manual monitor tick
│   └── dashboard/              # Authenticated app shell
│       ├── layout.tsx          # Dashboard nav/layout wrapper
│       ├── page.tsx            # Dashboard home
│       ├── [section]/          # Dynamic section placeholder
│       ├── case-library/       # Vulnerability case library
│       ├── defense-review/
│       │   └── [id]/
│       │       ├── page.tsx    # Review detail
│       │       └── report/     # Printable report
│       ├── doctrine/           # Doctrine engine
│       ├── incidents/
│       │   └── [id]/           # Incident detail
│       ├── project-map/        # Asset/project inventory
│       ├── threat-matrix/      # Threat family matrix
│       └── admin/
│           └── accounts/       # Tenant + user management
│
├── components/
│   ├── layout/                 # Shared layout components
│   └── case-library/           # Case library UI + badges
│
└── lib/
    ├── saas/                   # Auth, users, accounts, memberships
    ├── case-library/           # Case data, filters, mock data
    ├── defense-review/         # Defense review API + types
    └── project-map/            # Project map API + types
```

## Authentication

Login is currently email-based (no password). On success, the API sets an HttpOnly, SameSite session cookie through the same-origin backend proxy. Existing browser sessions that still have `sce_session_token` in `localStorage` are migrated to the cookie after the next successful identity check, then the legacy value is deleted.

`GET /saas/me` validates the session and hydrates the current user, account memberships, and permissions. Successful client lookups are reused for 30 seconds to avoid duplicate navigation requests.

### Roles

`super_admin` · `sce_operator` · `account_owner` · `security_admin` · `developer` · `operations_lead` · `reviewer` · `viewer` · `client_admin` · `client_member` · `client_viewer`

## API

Browser service files call the same-origin `/api/backend/*` proxy. The proxy forwards requests to the server-only `API_URL`, falling back to `NEXT_PUBLIC_API_URL` and then `http://127.0.0.1:8000`. This keeps session traffic same-origin and avoids browser CORS preflights.

Production dashboard mutations that require backend admin authorization are routed through Next API handlers so the admin key is never exposed to the browser. Configure the web service with:

```bash
API_URL=https://your-api-domain.com
SCE_ADMIN_API_KEY=<same strong secret configured on the API service>
```

Do not use a `NEXT_PUBLIC_` prefix for `SCE_ADMIN_API_KEY`.

## Path aliases

`@/*` resolves to `src/*` — e.g. `import { login } from "@/lib/saas/service"`.
