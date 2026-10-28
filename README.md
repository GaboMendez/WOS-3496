# State 3496 Portal

An unofficial community portal for State 3496 in *Whiteout Survival*. The public site presents alliance, governance, transfer, timeline, SvS, operations, and creator information. Staff manage content at `/admin`.

The app runs on Next.js and a local SQLite database. It does not require a hosted database or authentication service.

Visitors can read public pages without signing in. Staff publish records through the admin editor; pages show an empty state when relevant content has not been entered. Dates on the site are shown in UTC, with a local-time toggle for recurring alliance events. Images come from staff-entered URLs or the default fortress artwork. The layout supports phones, tablets, and desktops.

## Quick start on Windows

From the project directory in PowerShell:

```powershell
bun install --frozen-lockfile --registry=https://registry.npmjs.org
New-Item -ItemType Directory -Force data | Out-Null
if (-not (Test-Path -LiteralPath '.env.local')) {
  $secretBytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
  Set-Content -LiteralPath '.env.local' -Value "JWT_SECRET=$([Convert]::ToBase64String($secretBytes))" -Encoding Ascii
}
bun run db:migrate
bun run db:bootstrap-admin
bun run dev
```

Open <http://localhost:3000>. Run `db:migrate` only for a new database. If you already have `data/portal.db`, keep it and skip that command. `db:bootstrap-admin` prompts for an email and masked password; it can also reset an existing local admin account.

If you create or change `.env.local` while the server is running, stop it with Ctrl+C and run `bun run dev` again. Next.js reads environment variables at startup.

To load **demo content** into an empty database, run `bun run db:seed` once before starting the app. The seed is sample data, not real State 3496 records. A new database has no previous content; restore a backup or add content in `/admin`.

## Fresh rebuild

Stop the running server, then reinstall and build:

```powershell
bun install --frozen-lockfile --registry=https://registry.npmjs.org
bun run build
bun run start
```

Remove `.next` first if you want to clear the build cache. Keep `data/portal.db` and `.env.local` to preserve content and JWT signing continuity. Use `bun run dev` instead of `bun run start` while editing code.

## Stack and layout

| Area | Implementation |
| --- | --- |
| Web app | Next.js 15 App Router, React 19, TypeScript |
| Database | Local SQLite through `@libsql/client` and Drizzle ORM |
| Authentication | Salted scrypt password hashes and signed HTTP-only cookies |
| UI | Tailwind CSS 3, Radix UI, Lucide icons, Recharts where data exists |
| Runtime | Bun for scripts; Next.js server with a persistent local disk |

```text
app/                  Next.js pages and route handlers
app/globals.css       Shared semantic color tokens and utilities
db/                   SQLite schema, connection, seed, and admin bootstrap
drizzle/sqlite/        SQLite migrations
src/components/site/  Shared public layout and page primitives
src/components/ui/    UI components
src/lib/              Data queries, authentication, and formatting
public/images/        Default hero artwork
data/                 Local database and backups (ignored by Git)
```

Public pages query SQLite on the server. Content edits can appear without rebuilding. The app needs a server process and persistent storage; it is not a static export.

## Public pages

| Route | Content |
| --- | --- |
| `/` | Hero, state settings, server day, alliance and SvS metrics, recent results, featured creators |
| `/alliances` | Published alliance directory with power, open spots, and recruiting status |
| `/alliances/[slug]` | Alliance profile, leadership, HQ, and recurring event times with UTC/local toggle |
| `/governance` | Active or published documents with linked sections |
| `/transfers` | Published transfer windows and guides, plus planner and power guide links |
| `/transfers/route` | Shortest recorded route between states using published transfer groups |
| `/transfers/power-guide` | Reversible, permanent, and general guidance with risk notes |
| `/timeline` | Published chronological events |
| `/operations` | Published operations content |
| `/svs` | Published SvS cycles and result counts |
| `/svs/[slug]` | Match story, scores, entered score timeline, and alliance contributions |
| `/community` | Published creator profiles |
| `/auth` | Local account registration and sign-in |

Pages with no relevant records show an empty state. The default hero image can be replaced with the URL in State settings. Transfer routes are planning aids; confirm current requirements before acting.

### Page details

- **Home:** The hero uses the state name, tagline, and optional Discord link from settings. The status strip shows server day, hero era, recruiting and transfer status, timezone, and last update. Database-backed cards summarize alliances, open spots, combined power, and SvS results; recent SvS cycles link to match stories. Current event, next milestone, quick links, and featured creators complete the page.
- **Alliances:** The directory shows published entries and links to profiles. A profile includes its description, power, open spots, playstyle, timezone, HQ coordinates, SvS contribution, Discord contact, leaders, and recurring events. Event times can switch between UTC and the viewer's local time.
- **Governance:** Active and published documents show version, dates, summary, and sections with a contents list. Draft and archived documents are available to staff in the editor.
- **Transfers:** Published windows include status, transfer type, dates, spots, eligibility, and notes. The route planner runs breadth-first search over staff-maintained state groups and shows the shortest recorded hop sequence. The power guide groups reversible, permanent, and general actions and highlights risk notes.
- **Timeline and operations:** The timeline lists dated events with categories and descriptions. Operations lists published guidance entered by staff. Both use empty states when no content is available.
- **SvS:** The index shows result counts and published cycles. A match page shows prep and battle scores, story text, a score timeline chart when metrics exist, and an alliance contribution table.
- **Community:** Published creator cards show name, platform, content type, bio, and an external profile link. External content is linked rather than embedded.

## Admin and authentication

New sign-ups receive the **viewer** role. Create the first **admin** with `bun run db:bootstrap-admin`; the first public sign-up is not made an admin automatically. Admins can assign roles from `/admin`.

| Role | Access |
| --- | --- |
| Viewer | Public pages only |
| Editor | Create, edit, publish, and delete content records |
| Admin | Editor access, State settings, and user roles |

The server checks roles on every admin API request. Passwords are stored as salted scrypt hashes, and JWTs are carried in HTTP-only cookies. Set a strong `JWT_SECRET` in the ignored `.env.local` file; `.env.example` is only a template. Accounts from the earlier local auth implementation that have no password hash need a new local password through the bootstrap command.

The admin editor covers State settings, announcements, alliances, alliance leaders and events, governance documents and sections, transfer windows, groups and guides, timeline events, SvS cycles and metrics, state stories, operations content, creators, and media asset URLs. Related records use IDs such as `allianceId`, `documentId`, and `cycleId`. Transfer group `states` and State settings `socialLinks` are entered as JSON arrays, for example `[3496,1204]`.

### Editable content

| Resource | Main fields and relationship |
| --- | --- |
| State settings | State number, name, tagline, Discord URL, launch date, transfer group, eligibility, recruiting status, spots, power cap, current and next event, timezone, hero era and image, disclaimer, social links. Admin only. |
| Announcements | Title, body, pinned, published. |
| Alliances | Slug, tag, name, power, open spots, recruiting status, playstyle, timezone, HQ, SvS contribution, Discord and banner URLs, descriptions, published. |
| Alliance leaders | `allianceId`, name, rank, Discord handle, sort order. |
| Alliance events | `allianceId`, event name, days, UTC time, notes, sort order. |
| Governance documents | Title, version, status, effective and revised dates, summary. Use `active` or `published` for public display. |
| Governance sections | `documentId`, title, anchor, body, sort order. |
| Transfer windows | Name, type, status, phase, UTC start and end, eligibility, spots, power cap, notes, sort order, published. |
| Transfer groups | Name, `states` JSON array, window label, notes, published. These supply route planning. |
| Transfer guides | Title, `actionKind`, body, risk note, sort order, published. Use `reversible` or `permanent` to place a guide in those sections. |
| Timeline events | Title, category, date, server day, description, image and source URLs, published. |
| SvS cycles | Slug, opponent, date, prep and battle results and scores, story title, intro, body, image, published. |
| SvS story metrics | `cycleId`, label, `metricKind`, our and opponent values, sort order. Use `timeline` or `contribution` for `metricKind`. |
| State stories | Slug, title, summary, body, image, featured, publication date, published. |
| Operations content | Section key, title, body, sort order, published. |
| Creators | Name, platform, handle, content type, profile and avatar URLs, bio, featured, sort order, published. |
| Media assets | Name, kind, URL, storage path. The editor records links rather than uploading files. |

Admin and editor access is enforced in the Next.js API, rather than by database row-level security. Admins can change roles; the API prevents an admin from removing their own admin role. The editor currently permits staff to delete content records, while State settings cannot be deleted.

## Database and content

The default database is `data/portal.db`. Set `DATABASE_URL` to another `file:` URL if you need a different local SQLite file. The directory containing the file must exist.

| Group | Tables |
| --- | --- |
| Accounts | `profiles`, `user_roles` |
| State and notices | `state_settings`, `announcements` |
| Alliances | `alliances`, `alliance_leaders`, `alliance_events` |
| Governance | `governance_documents`, `governance_sections` |
| Transfers | `transfer_windows`, `transfer_groups`, `transfer_guides` |
| History and SvS | `timeline_events`, `svs_cycles`, `svs_story_metrics`, `state_stories` |
| Other content | `operations_content`, `creators`, `media_assets` |

Only published records are returned by the main public content queries; governance accepts `active` and `published` status. Editors can manage drafts through the admin API. Media assets store URLs; there is no file upload workflow. Use the admin editor for ongoing content changes. `db:seed` is intended for an empty demo database and is not idempotent.

Formatting helpers in `src/lib/state.ts` calculate server day from the UTC launch date, abbreviate power (for example, `1.2B` or `345.6M`), format UTC dates, and convert an alliance event's `HH:MM` UTC time to the visitor's local time. The root layout supplies site-wide page and social metadata; transfer detail pages supply their own titles and descriptions. Admin pages are marked for no indexing.

### Database commands

| Command | Purpose |
| --- | --- |
| `bun run db:migrate` | Create the schema in a new database from `drizzle/sqlite` |
| `bun run db:upgrade` | Upgrade a database made by the first Next.js migration |
| `bun run db:bootstrap-admin` | Create or reset a local admin account |
| `bun run db:seed` | Add sample content to an empty database |
| `bun run db:studio` | Browse the local database in Drizzle Studio |
| `bun run db:generate` | Generate a migration after changing `db/schema.ts` |

Back up `data/portal.db` before manual schema changes. Never run `db:seed` against a database containing content you want to keep.

## Visual system

Public pages use the shared tactical dark palette in `app/globals.css` and Tailwind mapping in `tailwind.config.js`. Keep new screens on the semantic tokens `background`, `card`, `surface`, `foreground`, `muted`, `border`, `primary`/`gold`, `steel`, and `ember`. The shared `SiteLayout`, header, footer, and page primitives are in `src/components/site`.

JetBrains Mono is used for headings, labels, and data readouts; Work Sans is used for body text. Both are loaded by `app/layout.tsx`. Shared CSS utilities include `label-mono`, `data-mono`, `surface`, and `hero-scrim`. The layout adapts to mobile screens and lets wide tables scroll.

| Token or utility | Use |
| --- | --- |
| `background`, `foreground` | Page canvas and primary text |
| `card`, `surface`, `muted` | Panels and quieter surfaces |
| `primary`, `gold` | Actions, active emphasis, and focus |
| `steel` | Informational highlights and links |
| `ember`, `destructive` | Warnings, risk notes, and errors |
| `border`, `input`, `ring` | Dividers, controls, and keyboard focus |
| `hero-scrim` | Dark overlay that keeps text readable on the hero image |

The shared header has the 3496 badge, public navigation, an optional Discord button, and a mobile menu. The footer reads social links and the community disclaimer from State settings. `src/components/site/primitives.tsx` provides section headings, data readouts, empty and loading states, error notes, and status tags. The default hero image is `public/images/state-hero.jpg` and can be replaced from State settings.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Build for production and check Next.js types |
| `bun run start` | Start the production server after a build |
| `bun run lint` | Run ESLint |
| `bunx tsc --noEmit --incremental false` | Check TypeScript independently |

After starting the app, visit `/`, `/alliances`, `/transfers/route`, `/transfers/power-guide`, `/svs`, and `/admin`. Confirm that a published edit in `/admin` appears on its public page. Check that a viewer cannot access admin resources and an editor cannot change State settings or roles.

## Scope

This portal links to external community content and Discord. It does not include photo uploads, CSV or player imports, appointment booking, automated scheduling, resource allocation, an SvS prep scheduler, Google sign-in, or a hosted public deployment. It is an unofficial fan project and is not affiliated with the game publisher.

The project began as a portal with a tactical command dashboard design and was migrated to Next.js and local SQLite. The README describes the current implementation; older plans that mentioned hosted row security, automatic first-admin assignment, search controls, or custom error pages are not current behavior.
