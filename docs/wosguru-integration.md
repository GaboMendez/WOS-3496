# State intelligence refresh

The portal imports a dated snapshot from the public English State 3496 page, including all public player and furnace pagination advertised by that page. It does not load individual player profiles, crawl other states, use browser automation, send telemetry, sign in, or request paid content.

The full snapshot includes every displayed state aggregate, rating/rank and peer comparison; all alliance rows on the page; the complete source roster; every furnace-band member and sublevel; seven other player leaderboards; power concentration; SvS history, rating changes and occupation durations; forecast opponents and match stages; castle holders and presidency counts; transfer arrivals/departures; transfer-group neighbours and peer states; and upcoming-event labels. Expandable sections are parsed too. Source links to the roadmap, share card and broader alliance/group listings are retained without recursively crawling those other pages.

Player rows retain their authoritative roster rank and rounded display power. Exact power and numeric furnace levels from the furnace endpoint are linked by Chief ID. All original furnace rows are also retained separately, including anonymous rows that cannot be reliably matched to a roster entry. State and secondary-leaderboard display values retain their source precision. Event labels are preserved rather than assigned an inferred year or confirmation status. Measurement time, leaderboard date and retrieval time remain distinct.

## What visitors see

- The homepage presents state ratings, aggregate comparisons and peer-state information.
- `/alliances` shows imported and staff-managed alliances in the same directory, while keeping their managed fields separate in the database.
- `/community` presents the full source roster with search, alliance/furnace filters and pagination, plus furnace distribution, player leaderboards and power concentration. The source is still a partial view of the state population; importing all its rows does not make it a census.
- `/svs` shows battle results, forecasts and castle information; `/transfers` shows movements and group details; `/timeline` shows upcoming events.
- The former `/intelligence` page redirects to the homepage. Source section facts and expandable tables appear on their related pages; unknown future section types fall back to the homepage.
- `/api/intelligence` returns the complete validated public snapshot; `?download=1` downloads it as JSON. Import checkpoints, errors, leases and credentials are never exposed by this endpoint.
- The homepage uses imported state power/ratings/rank and the source's SvS win/loss record when a valid snapshot exists. It falls back to the existing local records before the first import.
- Administrator-managed recruitment, contacts, rules, stories, roles, alliance ownership and editorial fields take precedence and are not overwritten by imported measurements.

The `source_sync` table retains the latest validated payload, last attempt/success, cooldown, issues, database lease and an unpublished checkpoint. Complete refreshes atomically update the portal's state settings, alliances, players and SvS cycles, as well as related observation tables for detailed sections, rankings, furnace records and undated schedules. Public views read those database records rather than the source payload. No source players are inserted into portal authentication or assigned guessed identities.

## Setup

Install the locked dependencies, apply the migration, and run an initial refresh:

```powershell
bun.exe install --frozen-lockfile
bun.exe run db:migrate
bun.exe run data:sync
```

Migration `0004_right_invaders.sql` creates `source_sync`; `0005_young_corsair.sql` adds its `pending_payload` checkpoint column. Neither changes editorial records. For a legacy database without Drizzle history, use the existing documented `db:upgrade` workflow. Do not run `db:seed` against production to enable this integration.

Migration `0006_complete_boom_boom.sql` adds the nullable, uniquely indexed `alliances.source_alliance_tag`. Migration `0007_peaceful_sentinels.sql` adapts the native entities and adds the observation tables. Apply migrations only to the intended database after a backup. For a database that already contains a complete version 2 snapshot, populate the new tables without contacting the source:

```powershell
bun.exe run data:sync --backfill-native
```

## Linking alliances

The importer creates source-managed alliance records when it can do so without colliding with an existing staff record. Existing staff records are linked only through a confirmed source tag; a matching display tag alone is not proof. Unresolved collisions and missing player identifiers are reported in admin refresh status and the CLI. Tags can change or be reused, and staff must review uncertain links. Player membership observed in a refresh is kept separately from an administrator's assignment. Players without a known alliance remain valid records.

Deleting an imported alliance, player or SvS cycle blocks its automatic recreation. An administrator can open **Suppressed imported records** and select **Allow import** for the appropriate entry; the record may return on the next successful refresh. Deleting an alliance with administrator-assigned players requires reassigning those players first.

The configured `DATABASE_URL` and `TURSO_AUTH_TOKEN` select the database. A CLI refresh automatically resumes batches until collection is complete, then publishes the validated data and native records in one transaction. It honors the same database lease, robots rules and cooldown as HTTP refreshes. Use `bun.exe run data:sync --status` to inspect coverage and pending progress. An offline parser preview does not connect to the database or write anything:

```powershell
bun.exe run data:sync --file 'C:\path\to\saved-state.html'
```

Cheerio is the single added direct dependency. The server uses `cheerio/slim` to parse HTML and decode entities without executing scripts or loading external resources. Existing Zod validates the resulting structured data.

## Vercel

Use the existing Next.js/Bun deployment configuration and hosted Turso database. Before releasing the new code:

1. Back up the intended production database and apply its migrations using the normal database deployment workflow. If it has a complete stored snapshot, run `bun.exe run data:sync --backfill-native` with the production database explicitly selected before deploying the application.
2. Set `CRON_SECRET` to a random secret of at least 32 characters in Vercel production environment variables. Keep `DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `JWT_SECRET` server-only. Never put these in `NEXT_PUBLIC_*` variables.
3. Deploy the application. `vercel.json` starts `/api/cron/wosguru` at `0 8 * * *` and invokes `/api/cron/wosguru/resume` at `0 10 * * *` daily (UTC). The second job only resumes an unfinished collection and otherwise makes no source requests. Both use the configured bearer secret and fail closed when it is missing/short. Guest sessions cannot authorize either route.
4. Sign in as an admin and use **State intelligence → Refresh now** for the first refresh. The control automatically requests further batches while showing roster/furnace progress. The admin POST requires the admin role and a same-origin request; editors/viewers cannot trigger imports. Verify coverage on `/community` and in the JSON export.
5. Confirm the first scheduled invocation in Vercel logs. Preview deployments do not receive scheduled cron invocations; use the admin control for preview validation.

Each scheduled job runs once per day, within Vercel Hobby's documented per-job frequency. Invocation can occur anywhere in the scheduled hour. Slow sources may require more batches: the CLI/admin control can resume saved progress, and an authorized invocation of the resume route can do the same. Vercel does not automatically retry failed cron runs. See [usage](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [management](https://vercel.com/docs/cron-jobs/manage-cron-jobs). Local SQLite files and in-memory cache are not durable production storage on Vercel.

## Failure handling and operations

- Successful refreshes impose a one-hour minimum interval shared by cron, CLI and admin triggers. A successful version 1 snapshot can undergo its one-time format upgrade immediately; error/blocked cooldowns are never waived. A two-minute atomic database lease prevents simultaneous collection. Public page views and local roster filters never initiate upstream fetches.
- Each batch requests at most 24 data pages, pacing their start times at least one second apart. It starts no further page request after a 25-second wall-clock budget, leaving time for the request timeout and database checkpoint write within a 60-second function. Admin/CLI continuation waits for the saved next-allowed time. Drafts expire after six hours.
- The observed complete import used the first roster page in HTML plus 20 additional roster pages and 26 furnace pages. It completed in two batches. Pagination totals, rank continuity, unique Chief IDs and every furnace sublevel count are validated before the completed snapshot is published. Source population changes during collection cause rejection rather than silent truncation.
- HTTP requests identify the portal honestly, omit credentials, reject redirects, and time out after twenty seconds each. Robots responses are capped at 64 KiB; HTML at 1 MiB. No cookies, raw HTML, or full API responses are stored.
- `429` honors `Retry-After` as seconds or HTTP date, with a minimum one-minute delay. Longer upstream cooldowns are never shortened. Other transient failures wait an hour. `401`/`403` or a robots denial suspend attempts for a day. There is no immediate retry loop, forced refresh, CAPTCHA solving, proxy rotation, or access-control bypass.
- Invalid page identity, essential missing fields, inconsistent ranks, malformed data, or older source measurement timestamps leave the last good data intact. A transient upstream HTTP failure retains the unfinished checkpoint for later resumption. Invalid source structures discard the draft. The payload and native records are published together only after roster and furnace coverage validate as complete.
- To pause collection, set `WOSGURU_SYNC_ENABLED=false` in the relevant deployment environment and redeploy. Existing data remains readable. This applies to the CLI and both HTTP triggers. Disable the cron in Vercel too if collection should remain paused across rollbacks.
- Apply the schema migration and backfill before deploying code that reads the new columns and observation tables. Database errors are not silently hidden.
- Admin status shows the last error and next allowed attempt; active refresh messages show collection progress. Upstream errors are summarized without logging roster bodies, credentials or request cookies. There is no raw-response archive or snapshot history; the latest good structured snapshot and any unfinished draft are retained.

The operator's redistribution permission has not been obtained. The project owner approved implementation after the feasibility review; that does not change the third-party terms recorded in the [research report](research/wosguru-state-3496.md).

## Verification

```powershell
bun.exe run test:wosguru
bun.exe test tests/alliance-admin.test.mjs
bun.exe test tests/source-placement.test.mjs
bun.exe test tests/native-integration.test.mjs
bun.exe test tests/native-observations.test.mjs
bun.exe test tests/source-suppression.test.mjs
bun.exe run lint
bun.exe run build
```

The isolated tests migrate an in-memory SQLite database and cover extraction, decoded names/IDs, changed markup, robots rules, bounded responses, retry timing, cooldowns, leases, preservation of staff records, and retention of the last good snapshot after errors or older data. The fixture is authored for testing; no downloaded roster is committed.

The expanded import was run against the local database used by localhost after a backup and the additive checkpoint migration. It collected 1,013 roster records and 1,013 exact-power furnace records, 24 castle holders, 50 transfer movements, seven extra leaderboards and 25 forecast opponents. The JSON export and page were checked against those counts. Tests also cover checkpoint resumption, upstream cooldowns, rank continuity and version 1 compatibility. Hosted databases and the deployed site were not changed.

For a parallel verification build on Windows, set `NEXT_DIST_DIR=.next-wosguru` in the build process environment to avoid the running development server's `.next` output. The default deployment directory remains `.next`.
