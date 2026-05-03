# Sales Dynamics 360 — Master Technical Specification

**Audience**: Junior engineers onboarding to this project.  
**Maintainer**: Engineering Lead  
**Last Updated**: May 2026  

> **Rule Zero**: Every decision you make must trace back to a section of this document. If it doesn't, either justify it in a PR comment or update this spec first.

---

## 1. Project Overview

Sales Dynamics 360 is an institutional sales management dashboard for Global's Global Markets / Institutional Sales business unit. It allows sales representatives, managers, and administrators to manage client-linked sales opportunities across a four-stage pipeline lifecycle.

### Core User Problems Being Solved
1. **Pipeline visibility**: Where are all my deals and which ones need attention?
2. **Activity tracking**: What communications have I had with each client?
3. **AI-driven prioritization**: Which deals should I act on this week?
4. **Multi-lingual support**: Teams across Switzerland (Zurich, Geneva, Lugano) work in EN/DE/FR/IT.

---

## 2. System Architecture

```
Browser (React/Vite)
      │
      │ HTTP (port 3000)
      ▼
Node.js Express Server (backend/server.ts)
      ├── GET  /api/metadata/schema   → Hardcoded schema (types, stages, users)
      ├── GET  /api/clients           → Spring Data JPA → H2 (H2 Database)
      ├── GET  /api/opportunities     → Spring Data JPA → H2 (enriched with client data)
      ├── POST /api/opportunities     → Create
      ├── PUT  /api/opportunities/:id → Update + history append
      └── DELETE /api/opportunities/:id → Delete
      
Vite Dev Middleware (integrated into same Node process)
      └── Serves frontend SPA from /frontend/src

H2 Database (backend/H2 Database)
      ├── clients table
      └── opportunities table
```

### Key Architectural Decisions You Must Respect

1. **Single process**: The app runs as ONE Node.js process (`npm run dev` from root). It runs `tsx backend/server.ts` which creates an Express server AND mounts a Vite dev-server middleware into the same process. **Do not separate them**.

2. **Database reseeds on every startup**: `database.ts` runs `sequelize.sync({ force: true })`. This wipes and recreates the DB on every boot. Do not change this without explicit approval — it's intentional for demo resets.

3. **No Java backend**: The `backend/src` directory contains a Spring Boot project that is NOT currently used. The real API is the Node.js `server.ts`. Do not run or reference the Java project unless explicitly asked.

4. **Metadata is server-hardcoded**: `/api/metadata/schema` returns a hardcoded JSON payload from `server.ts`. It does NOT read from the database. Changes to types, stages, or users must be made directly in `server.ts` lines 264–328.

5. **Frontend env vars**: `GEMINI_API_KEY` must live in the **root-level** `.env` file (next to `package.json`), not in `frontend/.env`. Vite is launched from the root directory, so it looks there via `loadEnv(mode, '.', '')` in `vite.config.ts`.

---

## 3. Data Schema

### 3.1 Client (`clients` table)

| Field | Type | Description |
|---|---|---|
| `id` | STRING PK | Format: `C1000`, `C1001`, … |
| `name` | STRING | Full name |
| `gender` | STRING | `MALE`, `FEMALE`, `NON_BINARY` |
| `segment` | STRING | `UHNW`, `HNW`, `AFFLUENT`, `RETAIL` |
| `totalWealth` | INTEGER | Net worth in USD |
| `riskTolerance` | STRING | `CONSERVATIVE`, `MODERATE`, `AGGRESSIVE` |
| `lastContact` | STRING | ISO 8601 date string |
| `health` | STRING | `HEALTHY`, `NEUTRAL`, `AT_RISK` |
| `avatar` | STRING | URL to avatar image |
| `address` | STRING | Swiss address string (used for geo proximity AI feature) |

**Seeded**: 50 clients generated on startup. See `database.ts:79–96`.

### 3.2 Opportunity (`opportunities` table)

| Field | Type | Description |
|---|---|---|
| `id` | STRING PK | Short random string (e.g., `"1"`, `"xk92j"`) |
| `clientId` | STRING FK | References `clients.id` |
| `type` | STRING | `SALES`, `TAGGING`, or `PRODUCT` |
| `title` | STRING | Short opportunity name |
| `stage` | STRING | `QUALIFY`, `DEVELOP`, `PROPOSE`, or `CLOSE` |
| `ownerAlias` | STRING | 2-character uppercase initials (e.g., `"AJ"`) |
| `priority` | STRING | `LOW`, `MED`, `HIGH`, or `WINNING` |
| `date` | STRING | Display date, e.g., `"OCT 24, 2024"` |
| `activities` | TEXT | JSON string: `Activity[]` |
| `history` | TEXT | JSON string: `HistoryEntry[]` |
| `accountName` | STRING | SALES type only: client account name |
| `value` | INTEGER | SALES type only: estimated revenue in USD |
| `estimatedCloseDate` | STRING | SALES type only: ISO date |
| `prioritySegment` | STRING | TAGGING type only: `GWM`, `IB`, or `AM` |
| `campaignCode` | STRING | TAGGING type only |
| `impactScore` | INTEGER | TAGGING type only: 1–10 |
| `productArea` | STRING | PRODUCT type only: `Trading`, `Reporting`, `Advisor Portals` |
| `voterCount` | INTEGER | PRODUCT type only |
| `urgency` | STRING | PRODUCT type only: `CRITICAL`, `FEATURE_REQUEST`, `NICE_TO_HAVE` |

**Important**: The `dynamicFields` concept in the frontend is a lens — type-specific fields (`accountName`, `value`, etc.) are stored as flat columns in the DB. The `preparePayload()` function in `KanbanBoard.tsx` serializes them back into `{ ...baseFields, dynamicFields: {...typeSpecificFields} }` for the API. The API then flattens them back when writing to the DB.

### 3.3 Activity (embedded JSON in `activities` column)

```typescript
interface Activity {
  id: string;          // Random short string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  date: string;        // ISO date: 'YYYY-MM-DD'
  notes: string;       // Free-text log
}
```

### 3.4 HistoryEntry (embedded JSON in `history` column)

```typescript
interface HistoryEntry {
  id: string;
  type: 'STATUS_CHANGE' | 'EDIT' | 'CREATE' | 'ACTIVITY';
  description: string;  // Human-readable, e.g., "Stage changed from QUALIFY to DEVELOP"
  user: string;         // Currently hardcoded to 'System' or 'Current User'
  date: string;         // Localized date string from new Date().toLocaleString()
}
```

History entries are **append-only**. They are never deleted or modified. `addHistoryEntry()` in `KanbanBoard.tsx` prepends new entries to the front of the array.

---

## 4. Opportunity Types & Stage Transitions

This is a critical piece of business logic. Each opportunity type has its own allowed stage transition map. The map is defined in TWO places (they must be kept in sync):

1. `backend/server.ts` lines 204–215 (runtime enforcement — currently soft validation only)
2. `backend/server.ts` lines 276–315 (metadata schema returned to frontend)

### SALES Transitions
```
QUALIFY → DEVELOP
DEVELOP → PROPOSE, QUALIFY
PROPOSE → CLOSE, DEVELOP
CLOSE   → PROPOSE
```

### TAGGING Transitions
```
QUALIFY → DEVELOP, CLOSE
DEVELOP → QUALIFY, CLOSE
```
(PROPOSE and CLOSE are entry-only for TAGGING; no outbound transitions defined.)

### PRODUCT Transitions
```
QUALIFY → DEVELOP
DEVELOP → PROPOSE
PROPOSE → CLOSE
CLOSE   → (none — terminal state)
```

### How Transition Validation Works
- **Frontend (Drag-and-drop)**: `KanbanColumn.tsx` reads `types[opp.type].allowedTransitions[opp.stage]` and visually dims invalid target columns. The API call is still made and the server has the final word.
- **Frontend (Modal)**: `LeadModal.tsx` disables invalid stage `<option>` elements using the same transition map.
- **Backend**: `server.ts` currently logs invalid transitions but does NOT reject them. This is a known gap — enforce if required.

---

## 5. User Roles & Permission System

### Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access to everything |
| `MANAGER` | Bulk actions, can delete own entries |
| `SALES_REP` | Create and edit own entries only |

### Permissions (implemented in `AuthContext.tsx`)

| Permission Key | ADMIN | MANAGER | SALES_REP |
|---|---|---|---|
| `CREATE_OPPORTUNITY` | ✅ | ✅ | ✅ |
| `EDIT_OPPORTUNITY` | ✅ | ✅ | Own only (`ownerAlias === user.alias`) |
| `DELETE_OPPORTUNITY` | ✅ | Own only | ❌ |
| `BULK_ACTION` | ✅ | ✅ | ❌ |
| `VIEW_INSIGHTS` | ✅ | ✅ | ❌ |
| `MANAGE_USERS` | ✅ | ❌ | ❌ |

### Role Switcher (Dev Tool)
The `TopNav` has a `<select>` that lets you switch between users. This is a **development convenience feature**, not a real auth system. Production would replace `AuthContext` with a real session/JWT check.

**Rule**: Always call `can(action, target)` before performing any privileged operation. Never check `user.role` directly in components.

---

## 6. Context Architecture

The app uses three React contexts, stacked in this order inside `App.tsx`:

```
<LanguageProvider>
  <MetadataProvider>
    <AuthProvider>   ← depends on MetadataProvider (fetches users)
      ...
    </AuthProvider>
  </MetadataProvider>
</LanguageProvider>
```

**Dependency order is strict**: `AuthProvider` reads `users` from `MetadataContext`, so it must be a child of `MetadataProvider`. Do not reorder.

### 6.1 LanguageContext
- Provides: `language`, `setLanguage`, `t(key)`
- `t(key)` falls back to `'EN'` if the current language doesn't have the key.
- Translations live in `frontend/src/translations.ts`.
- **Rule**: Every user-facing string must use `t()`. No hardcoded English strings in components.

### 6.2 MetadataContext
- Fetches `/api/metadata/schema` once on mount.
- Provides: `types`, `stages`, `users`, `isLoading`, `error`.
- Until loaded, `isLoading === true`. Components must handle this state.

### 6.3 AuthContext
- Depends on `MetadataContext` for the users list.
- Initializes with a placeholder user (`id: 'loading'`). Once metadata loads, defaults to `users[0]` (ADMIN).
- Provides: `user`, `setUser`, `can(action, target?)`.

---

## 7. Component Specifications

### 7.1 `TopNav`
- **Location**: Fixed to top, height `h-16`, `z-50`.
- **Responsibilities**: Logo/branding, main navigation tabs (Pipeline / Clients), role switcher, language switcher, Create Entry button, user avatar.
- **Create Entry**: Fires `window.dispatchEvent(new CustomEvent('open-lead-modal'))`. Both the TopNav button and the Sidebar button use this event bus pattern — `KanbanBoard` listens and opens the modal. Do not change this pattern.

### 7.2 `Sidebar`
- **Location**: Sticky left sidebar, 280px wide, slides in/out with spring animation.
- Only visible on `md:` and above breakpoints.
- Contains navigation and a "Create Entry" button (same event bus as TopNav).
- The collapse button appears only on hover of the sidebar header (`group/sidebar-header`).

### 7.3 `KanbanBoard`
- **The orchestrator component**. Owns all opportunity state, fetch logic, and all event handlers.
- **State it owns**:
  - `opportunities[]`: master list, fetched from API
  - `selectedIds[]`: multi-select state
  - `isModalOpen`, `editingOpportunity`, `isBulkEdit`: modal state
  - `confirmState`: state for the `ConfirmModal`
  - `searchQuery`, `viewMode`: display filter state
- **Key functions** (must understand before editing):
  - `fetchOpportunities()`: GET all opps, flatten `dynamicFields` into root for frontend use.
  - `preparePayload(data)`: Extracts base fields and packs type-specific fields back into `dynamicFields` before sending to API.
  - `addHistoryEntry(opp, type, desc)`: Creates a `HistoryEntry` and prepends it to `opp.history`. Does NOT call the API — the caller must call the API after.
  - `onDragEnd()`: Implements optimistic UI. Updates state immediately, calls API, and reverts on failure.

### 7.4 `KanbanColumn`
- Wraps `@hello-pangea/dnd`'s `<Droppable>`.
- Reads `allowedTransitions` from MetadataContext to visually indicate valid/invalid drop targets:
  - Valid target (during drag): highlighted with green tint + dashed red border.
  - Invalid target: dimmed to `opacity-20`.
- Renders the column total in CHF using the `value` field.

### 7.5 `OpportunityCard`
- Wraps `@hello-pangea/dnd`'s `<Draggable>`.
- **Click behavior**: 
  - Normal click → toggle `isExpanded` (show/hide Activities & History tabs).
  - `Shift+Click` or `Ctrl/Cmd+Click` → toggle multi-select (`onSelect(id, true)`).
  - Checkbox click → always multi-select (`onSelect(id, true)`).
- **Expanded view**: Two tabs — "Timeline" (Activities) and "History". Uses `AnimatePresence` for animated height transition.
- **Rendering**: Uses `metadata.fields` to render only `showOnCard` fields. The `isPrimary` field renders slightly larger.
- Edit/Delete buttons are conditionally rendered based on `can('EDIT_OPPORTUNITY')` and `can('DELETE_OPPORTUNITY')`.

### 7.6 `LeadModal`
- Slide-in panel from the right (`x: '100%'` → `x: 0`).
- Three modes: **Create** (new opp), **Edit** (single opp), **Bulk Edit** (multiple opps).
  - In Bulk Edit mode, `required` is bypassed on all fields.
- Fetches `/api/clients` on mount to populate the client selector.
- Dynamically renders type-specific fields from `metadata.fields` using `renderField()`.
- Stage selector shows allowed transitions and disables invalid options.
- **Known limitation**: Does not reset `selectedType` when switching from Edit to Create without closing. Be careful.

### 7.7 `BulkActionToolbar`
- Fixed to the bottom of the screen, slides up from `y: 100` when `selectedIds.length > 0`.
- For `SALES_REP` users: shows a restricted message (no actions).
- For `ADMIN`/`MANAGER`: shows Edit, Delete, and "Move To" controls.
- "Move To" is a CSS `group-hover` dropdown. **No JS state needed** — it opens on hover.

### 7.8 `KanbanInsights`
- Visible only if `can('VIEW_INSIGHTS')` returns `true` (ADMIN and MANAGER).
- Fixed width of `w-64`, rendered at the end of the kanban columns scrollable area.
- Calls `generatePipelineInsights()` from `aiService.ts` on button click.
- Renders the text response line by line, using indent style for bullet points (`-` prefix).

### 7.9 `ActivitySection`
- Embedded inside an expanded `OpportunityCard`.
- Shows list of activities with inline edit/delete (visible on card hover).
- Add form: type selector + date picker + textarea. Appears/disappears with animation.
- **AI Summary button**: calls `summarizeActivities()`. Sends activities + client address + employee address + risk tolerance + health status to Gemini. The geo-proximity logic is in the prompt itself.
- Summary rendered in a dismissable red-tinted card.

### 7.10 `HistorySection`
- Also embedded inside expanded card.
- Read-only. Renders a timeline of `HistoryEntry` items.
- Uses colored icons based on `entry.type`.

### 7.11 `ClientView`
- Grid of client cards. Filterable by name, ID, or segment.
- Clicking a client card opens `ClientDetailModal`.
- Health, segment, risk tolerance, and wealth are all visually represented.

### 7.12 `ClientDetailModal`
- Slide-in from right, `max-w-2xl`.
- Fetches all opportunities and filters by `clientId` on mount.
- Shows: Total AUM, Pipeline Value (sum of `value` field), Active Opp count.
- Clicking an opportunity in the modal navigates back to the Pipeline view and opens that opportunity's edit modal (via `onNavigateToOpportunity → setTargetOpportunityId` in `App.tsx`).
- "Generate Proposal" and "Log Call" buttons are **not yet implemented** (UI stubs).

---

## 8. AI Feature Specification

### 8.1 Gemini API Setup
- SDK: `@google/genai` (JavaScript SDK).
- API Key: `GEMINI_API_KEY` from root `.env`, injected by Vite's `define` into `process.env.GEMINI_API_KEY`.
- Current model: `gemini-2.5-flash` (as of May 2026 — verify against [AI Studio](https://aistudio.google.com/app/apikey)).
- If `API_KEY` is falsy, all AI functions return the string `"AI Service not configured."` — no error is thrown.
- Permission gate: `KanbanInsights` is only rendered for users where `can('VIEW_INSIGHTS')` is true.

### 8.2 `generatePipelineInsights(opportunities[])`
- **Entry point**: `KanbanInsights` component.
- **Input**: Array of opportunity objects (title, stage, value, priority, type).
- **Prompt strategy**: Instructs Gemini to act as a Chief Sales Officer. Asks for 3–4 bullets covering: Capital Concentration, Relationship Friction, Strategic Priority, Growth Forecast.
- **System instruction**: `"You are a Chief Sales Officer at a top-tier Swiss investment bank. Your insights must be data-driven, strategic, and concise. Use banking-grade terminology."`
- **Output**: Markdown-ish text, split by `\n` and rendered line by line.

### 8.3 `summarizeActivities(activities[], clientAddress?, employeeAddress?, riskTolerance?, health?)`
- **Entry point**: `ActivitySection` component.
- **Input**: Activity log + optional client/employee context.
- **Prompt strategy**: Asks for an executive summary aligned with client risk profile and health, with 2–3 "Next Best Actions". If both addresses are provided, adds a geo-proximity instruction: if they're within ~30km (same Swiss city/canton), recommend a face-to-face meeting ("Swiss Touch" meeting).
- **System instruction**: `"You are a professional sales analyst. Provide brief, bulleted summaries. Maximum 3-4 bullets."`
- **Output**: Same text rendering as insights.

### 8.4 Adding New AI Features
1. Add new exported `async function` in `aiService.ts`.
2. Gate invocation in the component using `can('VIEW_INSIGHTS')` or a new permission.
3. Add loading state and error fallback (return meaningful string on catch).
4. If the prompt introduces new user-facing labels, add them to `translations.ts` in all 4 languages.

---

## 9. Internationalization (i18n)

### Supported Languages
| Code | Language |
|---|---|
| `EN` | English (default) |
| `DE` | German |
| `FR` | French |
| `IT` | Italian |

### Rules for Every New String
1. Add the key to `translations.ts` under **all four** language blocks.
2. Use `snake_case` for the key name: `delete_confirm_title`.
3. For dynamic content, use `{variable}` syntax in the string and replace with `.replace('{variable}', value)` in the component.
4. Call `t('your_key')` in the component. Never pass raw English strings to UI.
5. Fallback: if a key is missing in the current language, `t()` falls back to `EN` then to the key itself.

### Known Gap
`DE`, `FR`, and `IT` blocks are missing some keys that exist in `EN` (e.g., `ai_summary`, `generate_ai`, `refresh_ai`, `analyzing`). When adding these keys, ensure all four blocks are updated.

---

## 10. API Contract

All endpoints are mounted on the same Express server at port 3000.

### `GET /api/metadata/schema`
Returns the hardcoded schema: types, stages, users.
```json
{
  "types": { "SALES": {...}, "TAGGING": {...}, "PRODUCT": {...} },
  "stages": [{"id": "QUALIFY", "label": "Qualify", ...}, ...],
  "users": [{"id": "1", "name": "Admin User", "role": "ADMIN", ...}, ...]
}
```

### `GET /api/clients`
Returns all 50 seeded clients as an array.

### `GET /api/opportunities`
Returns all opportunities **enriched with client data** (clientName, clientAvatar, clientAddress, clientRiskTolerance, clientHealth). Activities and history are parsed from JSON strings to arrays.

### `POST /api/opportunities`
**Body**: `{ clientId, type, title, stage, ownerAlias, priority, date, activities, history, dynamicFields: {...} }`
Creates a new opportunity. `dynamicFields` are merged into the flat DB columns.

### `PUT /api/opportunities/:id`
**Body**: Same structure as POST (partial updates are merged).
Appends a history entry if stage changes. Returns updated opportunity.

### `DELETE /api/opportunities/:id`
Returns `204 No Content`.

### `GET /h2-console`
A debug HTML page showing all opportunities and clients in a table format. Not a real H2 console — it's a custom HTML response from `server.ts`.

---

## 11. Design System & Styling

The app uses **Tailwind CSS v4** (via `@tailwindcss/vite`).

### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `brand-primary` | `#E20000` | Primary accent, CTAs, active state |
| `brand-primary-hover` | (slightly darker) | Button hover |
| `bg-surface` | White/zinc-50 | Main content background |
| `border-border-subtle` | `zinc-200` | Default border color |

### Typography Rules
- Headings: `italic font-bold uppercase tracking-tight` (Swiss design principle)
- Labels: `text-[9px] font-black uppercase tracking-widest text-zinc-400`
- Body: `text-sm font-medium text-zinc-600`

### Animation Library
`motion/react` (Framer Motion v12+). Use it for:
- Page transitions (`initial`, `animate`, `exit`)
- Modal slide-ins (`x: '100%'`)
- Card hover lift (`whileHover: { y: -2 }`)
- Collapsed/expanded height (`height: 0` → `height: 'auto'`)

### Shape Language
- No `rounded` corners on primary interactive elements (buttons, inputs, modals) — **sharp, square** corners only.
- Rounded corners are used on client cards in `ClientView` and `ClientDetailModal` for a softer look (rounded-lg, rounded-xl).

---

## 12. State Management Patterns

### Optimistic UI (Drag-and-Drop)
```
1. User drops card onto new column
2. UI immediately updates (setOpportunities with new stage)
3. API call is made in the background
4. If API fails → revert to previous state (prevOpps)
5. If API succeeds → refetch to get server-authoritative state
```

### Confirmation Gate (Destructive Actions)
All delete operations MUST go through `ConfirmModal`. The pattern:
```typescript
setConfirmState({
  isOpen: true,
  title: t('delete_confirm_title'),
  message: t('delete_confirm_message'),
  onConfirm: async () => { /* actual delete */ }
});
```
`ConfirmModal` calls `onConfirm` only if user clicks confirm. **Never call a delete API directly**.

### Multi-Select
- `selectedIds[]` lives in `KanbanBoard`.
- `handleSelect(id, multi)`:
  - `multi = true` (Shift/Ctrl/Cmd or checkbox): toggle the ID in the array.
  - `multi = false` (single click on card body): deselect all others or toggle if it's the only one.
- `BulkActionToolbar` appears when `selectedIds.length > 0`.

---

## 13. Known Issues & Technical Debt

| Issue | Location | Impact | Recommended Fix |
|---|---|---|---|
| DB wipes on every startup | `database.ts:52` | All data lost on server restart | Use `sequelize.sync({ alter: true })` for persistence |
| Backend transition validation not enforced | `server.ts:213-215` | Users can bypass stage rules | Add proper validation and return 400 |
| `HistoryEntry.user` is hardcoded | `KanbanBoard.tsx:82` | History doesn't attribute to real user | Pass `user.alias` from `AuthContext` |
| `dynamicFields` is `any` | `types.ts:47` | No type safety for type-specific fields | Create typed discriminated union per opportunity type |
| Missing i18n keys in DE/FR/IT | `translations.ts` | Falls back to English silently | Add all missing keys to all languages |
| `BulkActionToolbar` uses missing `t('clear')` key | `BulkActionToolbar.tsx:45` | Falls back to key name `"clear"` | Add `clear` to all translation blocks |
| `ClientDetailModal` has stub buttons | `ClientDetailModal.tsx:184–189` | "Generate Proposal" and "Log Call" do nothing | Implement or hide |
| `KanbanHeader` view mode toggle (`stage`/`status`) | `KanbanHeader.tsx` | `status` view is not implemented | Implement or remove the toggle |
| `force: true` in sync causes data loss | `database.ts` | Any restart wipes all user-created data | Only use for E2E tests; prod should use migrations |

---

## 14. Local Development Workflow

### Prerequisites
- Node.js v18+
- A Gemini API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Setup
```bash
cd /path/to/global-sales-management
cp .env.example .env
# Edit .env and set GEMINI_API_KEY="your_actual_key"
npm install
npm run dev
# → Open http://localhost:3000
```

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI features) | Gemini API key. Must be in root `.env`. |
| `APP_URL` | No | Not currently used in code. |

### Common Mistakes
- **"AI Service not configured"**: `GEMINI_API_KEY` is missing or in the wrong `.env` file.
- **"Failed to generate insights"**: Wrong model name or Gemini API quota exceeded. Check the model string in `aiService.ts`.
- **Data lost after restart**: Expected behavior. The DB reseeds on every boot.

---

## 15. Adding a New Feature — Checklist

Before opening a PR, verify:

- [ ] All user-facing strings use `t(key)` and the key is added to all 4 language blocks in `translations.ts`
- [ ] Any new destructive action goes through `ConfirmModal`
- [ ] Permissions are checked via `can(action, target)`, never by reading `user.role` directly
- [ ] Stage transitions are validated against `allowedTransitions` before calling the API
- [ ] History entries are recorded for all state changes (`STATUS_CHANGE`, `EDIT`, `ACTIVITY`)
- [ ] New AI features are gated with `can('VIEW_INSIGHTS')`
- [ ] New type-specific opportunity fields are added to both `database.ts` (Spring Data JPA model) and `server.ts` (metadata schema + API handlers)
- [ ] New components consume data from Context (not prop-drilling more than 2 levels)
- [ ] No hardcoded `user.role` checks anywhere in new code
- [ ] The spec (this file) is updated if the new feature changes data flow
