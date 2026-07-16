# Agent guidelines — MCP observability dashboard

Consolidated rules for AI agents and contributors. Full architecture, PR rollout, and design tokens live in [docs/PLAN.md](docs/PLAN.md). Product requirements: [docs/SPEC.md](docs/SPEC.md). API reference: [API.md](API.md).

---

## Project context

- **Stack:** React 19, React Router 7, TanStack Query/Table, Tailwind CSS 4, shadcn/ui, Vite, Hono + SQLite backend.
- **Path alias:** `@/` → `src/`.
- **Dev:** `npm run dev` (web on :3000, API on :3001 via proxy).
- **Verify changes:** `npm run typecheck`, `npm run lint`, `npm run test:run`.

---

## Code style

### Arrow functions

Use arrow function syntax for **all** function definitions:

- React components
- Utils and hooks
- Route modules
- Test helpers
- Server code (`server/`)

Do **not** use `function` declarations. Class definitions (e.g. custom `Error` subclasses) are fine.

```tsx
// Good
export const App = () => { ... };
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// Bad
export function App() { ... }
```

### Code hygiene

When changing a file, clean up after yourself:

- Remove **unused exports**
- Remove **unused variables** and **imports**
- Remove **unused component props** (including destructured props that are never read)
- Do not leave dead props, commented-out code, or orphaned helpers from refactors

Run `npm run typecheck` before finishing; fix any issues in touched files.

### Formatting

Separate logical blocks with a blank line:

- After the **import block** (imports stay grouped — no blank lines between individual imports)
- Between top-level **types**, **constants**, and **exports**
- Before **`return`** in function bodies when preceded by other statements (hooks, handlers, setup logic)

```tsx
import { cn } from "@/lib/utils";

const navItems = [...];

type AppSidebarProps = { ... };

export const AppSidebar = ({ ... }: AppSidebarProps) => {
  const { pathname } = useLocation();

  return (...);
};
```

### Scope and conventions

- **Minimize diff scope** — only change what the task requires.
- **Match existing patterns** — naming, imports, file layout, test style.
- **Route files stay thin** — business UI lives in `components/domain/`.
- **Co-located tests** — `{Module}.test.{ts,tsx}` beside the module; shared infra only in `src/test/`.

### ESLint

Run `npm run lint` (or `npm run lint:fix`) before finishing. Config: [eslint.config.js](eslint.config.js). Scope: `src/` and `vite.config.ts` only — `server/` is excluded.

| Guideline                      | ESLint rule                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| Arrow functions                | `no-restricted-syntax` (ban `FunctionDeclaration`)                        |
| Unused imports / variables     | `unused-imports/no-unused-imports`, `unused-imports/no-unused-vars`       |
| Blank lines between blocks     | `@stylistic/padding-line-between-statements`                              |
| Type-only imports              | `@typescript-eslint/consistent-type-imports`                              |
| No arbitrary hex colors `[#…]` | `no-restricted-syntax` (class literals)                                   |
| Named Tailwind variants        | `no-restricted-syntax` (bare `group-hover:`, `peer-hover:`, `@container`) |
| React hooks                    | `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`               |
| Accessibility                  | `eslint-plugin-jsx-a11y` recommended rules                                |
| No unsafe HTML                 | `react/no-danger`                                                         |

Some PLAN items (container-query layout, unnecessary `useEffect`, design-token fidelity) remain manual review — ESLint catches the enforceable subset.

---

## Architecture rules

1. **Read-only UI** — no mutations.
2. **URL is shareable state** — filters and selection live in the URL, not ephemeral React state.
3. **Derive visibility from URL** — `showDetail = Boolean(useParams()[detailParam])`; do not duplicate selection in React state.
4. **Preserve query params on back** — time range (`since`, `until`) and filters survive close/back navigation.
5. **Lazy log bodies** — fetch full log payload only when the detail panel is open.
6. **Full-width layout** — no root `max-w-*` wrapper; app fills browser width.
7. **Loading / empty / error** — every data view uses skeleton, contextual empty, and retry error states.
8. **404 on missing detail** — friendly not-found inside the detail pane, not a blank screen.

### Layout components

| Component            | Use                                            | Detail param                |
| -------------------- | ---------------------------------------------- | --------------------------- |
| `MasterDetailLayout` | Servers (`/` + `/servers/*`) and Logs          | `serverId`, `logId`         |
| `DetailDrawer`       | Deployment/session drill-down in server detail | `deploymentId`, `sessionId` |

- Detail pane / drawer renders **only when** the URL param is present — no empty placeholder column on list-only routes.
- Use **container queries** (`@container/{name}`) for master/detail and drawer reflow — not `useMediaQuery` / `matchMedia` (except sidebar hamburger tests).
- Viewport `lg:` only for sidebar fixed vs hamburger Sheet.

### Sidebar active state

- **Servers** active on `/` and `/servers/*`
- **Logs** active on `/logs` and `/logs/*`

---

## React

- Prefer **derived state** and URL params over syncing with `useEffect`.
- `useEffect` only for external system sync — document justification if used.
- Data via **React Query hooks**; no fetch-in-effect.
- No unnecessary abstractions or error handling for impossible edge cases.

---

## Design & Tailwind

- Match design tokens in [src/app.css](src/app.css) (`@theme inline`) — see PLAN.md §4.3.
- **No arbitrary Tailwind colors** (`[#…]`) — use theme utilities only.
- **Named variants only:** `group/{name}`, `peer/{name}`, `@container/{name}` — never bare `group-hover:` or `@container` without a name.
- Interactive elements need **hover**, **focus-visible**, and **active** states.
- Ghost/toolbar buttons use `text-muted-foreground`, not `text-muted` (which maps to background on this theme).

---

## Accessibility

- Keyboard navigable; visible `:focus-visible` rings.
- Icon-only buttons: `aria-label`.
- Overlays (Sheet, Dialog) trap focus; Escape closes.
- Detail back button: "Back to servers" / "Back to logs".
- Drawer close: "Close deployment detail" / "Close session timeline".
- Text meets WCAG AA contrast on panel backgrounds.

---

## Testing

- Co-located tests for core behavior added or changed.
- Shared setup in `src/test/setup.ts`, handlers in `src/test/handlers.ts`, `renderWithProviders` in `src/test/test-utils.tsx`.
- Use `createMemoryRouter` + full route tree for integration tests needing nested outlets.
- Do **not** mock `matchMedia` for master/detail tests — set container width via test wrapper styles instead.

---

## Security

- No XSS, injection, secret leakage, or unsafe HTML rendering.
- Validate or escape user-controlled input (URL params, search, API data) — prefer zod at boundaries.
- Never `dangerouslySetInnerHTML` on untrusted JSON/log payloads without sanitization.
- No secrets committed (`.env`, API keys, private URLs).
- Justify new dependencies; address or document high/critical `npm audit` findings.

---

## PR quality checklist

Copy into every PR description (full detail in PLAN.md §8.1):

- [ ] Co-located tests for core behavior
- [ ] Accessibility: keyboard, focus, ARIA
- [ ] Hover / focus-visible / active states on interactives
- [ ] Arrow function syntax — no `function` declarations
- [ ] No unused exports, variables, imports, or props in touched files
- [ ] Blank lines between logical code blocks
- [ ] `npm run lint` passes
- [ ] No unnecessary `useEffect`
- [ ] Container queries for layout; named group/peer/container variants
- [ ] Matches design tokens (PLAN.md §4.3)
- [ ] No arbitrary Tailwind color values (`[#…]`)
- [ ] Security: no vulnerabilities introduced; no secrets committed; untrusted data handled safely

---

## Key files

| File                                                                                         | Role                         |
| -------------------------------------------------------------------------------------------- | ---------------------------- |
| [src/app/router.tsx](src/app/router.tsx)                                                     | Route tree                   |
| [src/components/layout/MasterDetailLayout.tsx](src/components/layout/MasterDetailLayout.tsx) | Servers + Logs master/detail |
| [src/components/layout/DetailDrawer.tsx](src/components/layout/DetailDrawer.tsx)             | Deployment/session drawer    |
| [src/components/layout/AppShell.tsx](src/components/layout/AppShell.tsx)                     | Full-width shell + sidebar   |
| [src/app.css](src/app.css)                                                                   | Design tokens                |
| [server/routes.ts](server/routes.ts)                                                         | API routes                   |

For PR order and feature breakdown, follow [docs/PLAN.md](docs/PLAN.md) §10.
