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

Login is email-based (no password). On success the API returns a session token stored in `localStorage` under the key `sce_session_token` and passed on subsequent requests via the `X-SCE-Session` header.

`GET /saas/me` is called on every page load to validate the session and hydrate the current user, account memberships, and permissions.

### Roles

`super_admin` · `sce_operator` · `account_owner` · `security_admin` · `developer` · `operations_lead` · `reviewer` · `viewer` · `client_admin` · `client_member` · `client_viewer`

## API

All service files point to `http://127.0.0.1:8000`. To change the backend URL, update the base URL constants in:

- `src/lib/saas/service.ts`
- `src/lib/defense-review/service.ts`
- `src/lib/project-map/service.ts`
- `src/lib/case-library/service.ts`

There are currently no `NEXT_PUBLIC_` environment variables. If you need to make the API URL configurable, introduce `NEXT_PUBLIC_API_URL` and reference it in those files.

## Path aliases

`@/*` resolves to `src/*` — e.g. `import { login } from "@/lib/saas/service"`.
