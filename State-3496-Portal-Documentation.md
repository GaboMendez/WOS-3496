# State 3496 — Community Portal: Complete Documentation

> Unofficial fan community portal for **State 3496** in _Whiteout Survival_.
> Disclaimer shown site-wide: "Unofficial fan community. Not affiliated with the game publisher."

---

## 1. Overview

State 3496 is a public website for the state's players. Anyone can read it without signing in. Staff (admins and editors) manage every piece of content from a built-in Admin panel at `/admin`. Nothing on the public site is invented: when information hasn't been entered yet, pages show an honest **"Information coming soon"** message instead of fake data.

**Published URL:** not published yet

### Principles

- Public pages need no login. Only published content is shown to visitors.
- No placeholder text is presented as real information.
- All times are in **UTC**, with optional conversion to the visitor's local time.
- No stock photos. Images come from URLs entered by staff (or the default header artwork).
- No mock buttons or fake controls: every button works.
- Works on phones, tablets and desktops; tables and timelines scroll or reflow on small screens.

### Features deliberately NOT included

- SvS Prep Scheduler
- Appointment booking
- Player sign-up imports
- Resource allocation
- CSV uploads
- Automated scheduling
- Any "Snapshot" page

---

## 2. Technology

| Area           | Choice                                                                           |
| -------------- | -------------------------------------------------------------------------------- |
| Framework      | Next.js 15 App Router (React 19, TypeScript)                                     |
| Styling        | Tailwind CSS 3 (tokens in `app/globals.css`), Radix UI, Lucide icons             |
| Backend        | Local SQLite with Drizzle and protected Next.js route handlers                   |
| Data fetching  | Server-rendered SQLite queries; public pages refresh when content changes       |
| Charts         | Recharts (only from data entered by staff)                                       |
| Notifications  | Sonner toasts                                                                    |
| Hosting target | Node.js or Bun process with persistent local SQLite storage                      |

Authentication uses local salted password hashes and signed HTTP-only cookies. Bootstrap an admin with `bun run db:bootstrap-admin`.

---

## 3. Design System — "Tactical Command Dashboard"

Locked design direction, inspired by `wos-svs-manager-3496.vercel.app` but with its own identity.

### Look and feel

- Near-black canvas, charcoal panels, amber/orange signal accents.
- Editorial/magazine composition with a dense 12-column grid on the home page.
- Small corner radius (0.125rem), no glassy panels, no purple gradients, no decorative blobs.
- Dark color scheme only; letter-spacing 0.

### Colors (semantic tokens — components never hardcode colors)

| Token             | Value                                  | Use                                                     |
| ----------------- | -------------------------------------- | ------------------------------------------------------- |
| background        | oklch(0.1888 0.0103 248.37) (~#101418) | Page canvas                                             |
| card              | oklch(0.2250 0.0174 259.75) (~#171c24) | Panels                                                  |
| primary / gold    | **oklch(0.747 0.18 57.4)**             | Buttons, links, active nav, focus rings, charts, badges |
| secondary / muted | oklch(0.2818 0.0217 254.18) (~#2b3440) | Secondary surfaces                                      |
| muted-foreground  | oklch(0.7531 0.0206 252.92)            | Secondary text                                          |
| accent / border   | oklch(0.3218 0.0248 255.70)            | Lines and dividers                                      |
| input             | oklch(0.3859 0.0301 254.18)            | Form fields                                             |
| steel             | oklch(0.78 0.055 227)                  | Informational highlights                                |
| ember             | oklch(0.72 0.14 42)                    | Warnings / risk                                         |
| hero-scrim        | gradient overlay                       | Darkens the header photo for readable text              |

### Typography

- **JetBrains Mono** — headings, labels, data readouts (`--font-display`, `--font-mono`).
- **Work Sans** — body text (`--font-sans`).
- Loaded from Google Fonts in the root page head.

### Shared utilities and building blocks

- Utilities: `label-mono`, `data-mono`, `surface`, `hero-scrim`.
- Primitives (`src/components/site/primitives.tsx`): Section, SectionHeading, PageHeader, DataPoint (amber left border readout), EmptyState ("Information coming soon", dashed border), LoadingRows, ErrorNote, Tag.
- Layout: SiteHeader, SiteFooter, SiteLayout.

### Header

- Sticky top bar with the **3496** badge next to the state name.
- Navigation: Home, Alliances, Governance, Transfers, Timeline, Operations, SvS, Community.
- Active link highlighted in amber with an underline.
- "Join Discord" button (uses the Discord URL from settings).
- Admin link.
- Mobile: menu button (switches between menu and X icon) that opens a full link list and closes on navigation.

### Footer

- Social links pulled from settings (`social_links`).
- Community disclaimer.

### Header picture

- Default: generated frozen-wasteland fortress artwork (`src/assets/state-hero.jpg`, 1920×1080). It is placeholder artwork and can be replaced via **Hero image URL** in State settings.

---

## 4. Public Pages

Every page has its own title, description, social sharing tags (og:title, og:description, og:type, twitter:card), loading state, empty state and error state.

### 4.1 Home — `/`

- **Full-width header** with "State 3496" visible on first load, tagline, and buttons: **Join Discord**, **Explore Alliances**, **Transfer Information**.
- **Status strip:** server day (counted from the launch date, UTC), hero generation/era, recruiting status, transfer group, UTC notice, last updated time.
- **Metrics** (from the database): active alliances, combined power, open spots, SvS prep record, SvS battle record, latest prep score.
- **Recent SvS results** table with links to each match story.
- **Current event / next milestone** panel.
- Quick links to Governance, Operations, Timeline and Transfers.
- **Creators** section with a Discord call-to-action.
- Honest empty states when data is missing.

### 4.2 Alliances — `/alliances`

- Directory ranked by power.
- Search and filters (e.g. recruiting status).
- Total combined power.
- Each alliance links to its detail page.

### 4.3 Alliance detail — `/alliances/:slug`

- Banner image, tag, name, description.
- **Contact leadership** Discord button.
- Leadership list (R5 / R4).
- HQ coordinates, open spots, playstyle, expected SvS contribution.
- Recurring events shown in UTC with optional local-time conversion.

### 4.4 Governance — `/governance`

- The published governance document (title, version, effective date, last revised, summary).
- Sections with an anchor table of contents.
- Supports draft / published / archived versions (only published is public).

### 4.5 Transfers hub — `/transfers`

- Transfer window status (open / closed / upcoming), type (ordinary / special / group / alliance), phases, open/close dates in UTC.
- Eligibility range, available spots, power cap note.
- Discord call-to-action.
- Links to the Route Planner and Power Guide.

### 4.6 Transfer Route Planner — `/transfers/route`

- **From** and **To** state fields (To defaults to 3496).
- Uses staff-maintained transfer groups (lists of state numbers).
- Calculates the shortest path between states (breadth-first search).
- Shows the list of hops with warnings.
- Clear "no route found" state.

### 4.7 Power Guide — `/transfers/power-guide`

- Separates **reversible** actions from **permanent** actions.
- Each item can carry a highlighted risk note.

### 4.8 Timeline — `/timeline`

- Current server day calculated from the launch date in UTC.
- Vertical chronological timeline with category chips: Heroes, Pets, Fire Crystal, Events, Systems, Sunfire, SvS, State History.
- "Now" marker; upcoming events styled differently from completed ones.
- Search.
- Accessible, expandable detail panels (description, source link, image).

### 4.9 Operations — `/operations`

- Roles: Rally Leads, Rally Managers, Comms, Intel, Overwatch.
- Battle etiquette, how to join rallies, voice-channel expectations.
- Discord call-to-action.
- Content grouped by section key (roles / etiquette / rallies / comms).

### 4.10 SvS — `/svs`

- Overall prep and battle records.
- Opponent history.
- Sortable results table.
- Published State Stories.

### 4.11 SvS match story — `/svs/:slug`

- Story title, intro and narrative.
- Score timeline chart (only when staff have entered data points — never fabricated).
- Alliance contribution table.
- Prep and battle scores vs. opponent.

### 4.12 Community — `/community`

- Creator cards (name, platform, handle, content type, bio, avatar, link).
- Featured guides, clips, recaps and projects.
- Prominent Discord **"Get featured"** button.
- External content is linked, never auto-embedded.

### 4.13 Sign in — `/auth`

- Email + password sign-in and sign-up.
- Redirects to `/admin` once signed in.
- New accounts may need to confirm their email before signing in.
- Hidden from search engines.

### 4.14 Not found / error pages

- Custom 404 page with "Go home".
- Error page with "Try again" and "Go home"; errors are reported automatically.

---

## 5. Admin Panel — `/admin`

Hidden from search engines; runs only in the browser.

### Access

- Not signed in → sign-in prompt.
- Signed in without staff role → "No editor access" message with a sign-out button.
- Admins and editors → full tabbed panel.

### Roles

| Role       | Can do                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| **Admin**  | Everything: create, edit, publish, archive, reorder, delete; edit State settings; grant and revoke roles |
| **Editor** | Create and edit content (drafts and publishing toggles); cannot delete, cannot change settings or roles  |
| **Viewer** | Default for new accounts; no admin access                                                                |

The **first account ever created automatically becomes Admin**; every later account starts as Viewer.

### Tabs and editable fields

1. **State settings** (admin only): state number, display name, tagline, Discord invite URL, launch date (server-day origin), transfer group, eligibility range, recruiting status, available transfer spots, power cap note, current event, next event date (UTC), timezone label, hero generation/era, hero image URL, community disclaimer. (Social links are also stored.)
2. **Announcements:** title, body, pinned, published.
3. **Alliances:** slug, tag, name, power, open spots, recruiting status, playstyle, event timezone, HQ coordinates, expected SvS contribution, Discord contact URL, banner image URL, short and full description, published — plus nested **Leaders** (R5/R4) and **Recurring events**.
4. **Governance:** documents (title, version, effective date, last revised, status draft/published/archived, summary) plus nested **Sections**.
5. **Transfers:**
   - Windows: name, status, phase, type, opens/closes (UTC), eligibility range, open spots, power cap note, notes, sort order, published.
   - Groups: group name, state numbers (comma separated), window label, notes, published — these feed the Route Planner.
   - Guides: title, kind (reversible/permanent), body, risk note, sort order, published — these feed the Power Guide.
6. **Timeline:** title, category, date, server day, description, source link, image URL, published.
7. **SvS:** slug, opponent, date, prep result, battle result, our/opponent prep score, our/opponent battle score, story title, intro, body, image URL, published — plus nested **story metrics** (score timeline points and alliance contributions).
8. **Stories:** slug, title, summary, body, image URL, featured, published at, published.
9. **Operations:** section key, title, body, sort order, published.
10. **Creators:** name, platform, handle, content type, profile URL, avatar URL, bio, featured, sort order, published.
11. **Media:** name, URL, kind, storage path (a library of image links).
12. **Roles** (admin only): find users by profile and grant/revoke admin or editor.

Field types supported by the editor: text, long text, number, yes/no, date, date-time, and number lists.

---

## 6. Database

### Tables

| Table                | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| profiles             | One per user account                                                      |
| user_roles           | Roles (admin / editor / viewer), kept separate from profiles for security |
| state_settings       | Single row of state-wide settings                                         |
| announcements        | News / notices                                                            |
| alliances            | Alliance directory                                                        |
| alliance_leaders     | R5/R4 per alliance                                                        |
| alliance_events      | Recurring alliance events                                                 |
| governance_documents | Rule documents with versions/status                                       |
| governance_sections  | Sections of a document                                                    |
| transfer_windows     | Transfer windows and phases                                               |
| transfer_groups      | Groups of states for route planning                                       |
| transfer_guides      | Reversible/permanent power guide items                                    |
| timeline_events      | State history and game milestones                                         |
| svs_cycles           | SvS matches, scores and stories                                           |
| svs_story_metrics    | Chart and contribution data per match                                     |
| state_stories        | Editorial stories                                                         |
| operations_content   | Operations page content                                                   |
| creators             | Community creators                                                        |
| media_assets         | Image library                                                             |

### Security rules

- Row-level security on every table.
- Visitors see only rows marked **published** (governance: status = published; leaders, events, sections and metrics are visible when their parent is published; media is always readable; settings are always readable).
- Staff (admin or editor) can read everything, create and edit.
- Only admins can delete, change settings, or manage roles.
- Helper checks `has_role` and `is_staff` run on the server, never in the browser.
- `updated_at` timestamps update automatically.
- A new-account trigger creates the profile and assigns the first-user-admin / viewer role.

---

## 7. Utilities

- **Server day:** days since the launch date (UTC), starting at day 1.
- **Power formatting:** 1.2B / 345.6M / 12K; empty shows "—".
- **Dates:** formatted in UTC (e.g. "05 Oct 2026", "05 Oct 2026, 14:00 UTC").
- **Local time conversion:** turns "HH:MM" UTC into the visitor's local time.

---

## 8. Search & Sharing

- Every page has a unique title, description and social sharing tags.
- Admin and sign-in pages are excluded from search engines.
- Hosting supplies preview images for shared links.

---

## 9. Current Status & Next Steps

- All 13 public pages, sign-in and admin panel are live in preview.
- The database is empty, so pages currently show "Information coming soon" until staff add and publish content.
- To start: create the first account (becomes Admin) → fill in **State settings** → add alliances, transfers, timeline, SvS results, etc. → tick **Published**.
- Not yet available: photo upload button (use image URLs), Google sign-in (email/password only).
- Header picture is placeholder artwork until replaced.
- Site not yet published to a public URL.

---

## 10. Change History

1. Initial build: database, security, all public pages, admin panel, sign-in, default header artwork.
2. Security update of the framework packages.
3. Redesign to the tactical command-dashboard look (charcoal + amber, JetBrains Mono + Work Sans, 12-column home grid, 3496 header badge).
4. Mobile menu icon fix; sharing tags added to every page.
5. Accent color changed to oklch(74.7% 0.18 57.4).
