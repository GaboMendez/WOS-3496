# State 3496 seed

The seed loads the State 3496 data directly into the tables used by the portal and its admin editor. There is no separate source-data layer at runtime.

`db/seeds/state3496.json` contains the fixed data. `db/seeds/generate.ts` maps it to the Drizzle models:

| Data                                               | Tables                                 |
| -------------------------------------------------- | -------------------------------------- |
| State statistics, progression and transfer details | `state_settings`                       |
| Alliance tags and players                          | `alliances`, `players`                 |
| Player power rankings                              | `ranking_snapshots`, `ranking_entries` |
| SvS results                                        | `svs_cycles`                           |
| Presidency appointments and structures             | `rotation_slots`, `facilities`         |
| Events and history                                 | `calendar_events`, `timeline_events`   |
| Transfer eligibility                               | `transfer_groups`                      |

The dataset includes six alliance tags, eleven players, eleven SvS results, three presidency appointments, eighteen calendar entries and seventeen structures. Known aggregate state figures are stored in ordinary `state_settings` columns. Unknown powers, officer ranks, coordinates, recruitment details and term end dates remain `null`. The counts of four main alliances and three FARM come from the project owner; their identities and ownership assignments are not guessed.

The historical figures and names were taken from the indexed [State 3496 page on WoS Guru](https://wosguru.com/ko/state/3496), reviewed on 29 October 2026. Player power was rounded in that page. Future dates are stored as tentative, all-day calendar events. [WoS Atlas](https://wosatlas.com/es/) and [State 3156](https://state3156.com/) were researched as references; no usable public API was verified, and WoS Oracle blocked the research tool. This research stays in development documentation, not the public UI.

## Run

The default database is `file:data/portal.db`. Keep the existing JWT secret and staff accounts.

```powershell
bun.exe run db:migrate
bun.exe run db:seed
bun.exe dev
```

For an older database created without Drizzle migration history, run `bun.exe run db:upgrade` before seeding. It adopts the existing baseline and applies pending migrations. Migration `0003_shocking_post.sql` removes the previous generated fixtures and JSON-source tables, adds the state statistic fields and allows missing values in the relevant models. It protects unrelated records and checks foreign keys before committing.

## Restore and validate

```powershell
bun.exe run db:seed:preview  # validate without writing
bun.exe run db:seed:check    # compare seeded rows with the fixture
bun.exe run db:seed:reset    # recreate only the known seeded rows
```

`db:seed` uses deterministic IDs and timestamps and upserts the same rows on every run. It preserves staff profiles, passwords, roles and unrelated editorial content. `db:seed:reset` deletes only the fixture's known IDs in dependency order and rolls back if additional records depend on them.
