# State 3496 Portal

A community portal for Whiteout Survival State 3496.

## Quick Start

```bash
# Install dependencies
bun install

# Create the local SQLite schema on a fresh checkout
bun run db:migrate

# Optional: add sample content to an empty database
bun run db:seed

# Start development server
bun run dev
```

Then open <http://localhost:3000>

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: SQLite (local file-based)
- **ORM**: Drizzle
- **Auth**: Custom JWT
- **UI**: Tailwind CSS + Radix UI
- **Runtime**: Bun

---

## Database

The database is stored in `data/portal.db` (SQLite file). Set `DATABASE_URL` to another `file:` URL to use a different local database. The SQLite migrations are in `drizzle/sqlite`.

Set a strong `JWT_SECRET` in an ignored `.env.local` file before running the app. The example value in `.env.example` is only a template.

```bash
# Initialize an empty database
bun run db:migrate

# Upgrade a database created by the first Next.js migration
bun run db:upgrade

# Seed with sample data
bun run db:seed

# Open database studio
bun run db:studio
```

---

## Project Structure

```
app/                    # Next.js App Router pages
├── page.tsx           # Home page
├── alliances/         # Alliance pages
├── svs/              # SVS records
├── transfers/        # Transfer info
├── timeline/         # Server timeline
├── governance/       # Rules & documents
├── operations/       # Operations guide
├── community/        # Content creators
├── auth/             # Login/Register
├── admin/            # Admin dashboard
└── api/              # API routes

db/
├── schema.ts         # Database schema
├── index.ts          # Database connection
└── seed.ts           # Sample data

src/
├── components/       # React components
├── hooks/            # Custom hooks
└── lib/              # Utilities & auth

drizzle/              # Database migrations
```

---

## Testing Guide

### 1. Start the Development Server

```bash
bun run dev
```

Then open <http://localhost:3000>

### 2. Test Home Page

- Hero image loads
- State name "State 3496" displays
- Tagline shows
- Navigation links work
- Server day shows
- Alliances count displays
- SVS records table shows data

### 3. Test Alliances Page (`/alliances`)

- Alliance list displays
- Each shows: tag, name, power, recruiting status
- Click alliance to see detail page

### 4. Test SVS Page (`/svs`)

- Battle records table displays
- Win/Loss counts are correct
- Click "Story" to see detail page

### 5. Test Transfers Page (`/transfers`)

- Transfer windows display
- Transfer guides display

### 6. Test Timeline Page (`/timeline`)

- Timeline events display

### 7. Test Governance Page (`/governance`)

- Documents list displays

### 8. Test Operations Page (`/operations`)

- Operations content displays

### 9. Test Community Page (`/community`)

- Creator cards display

### 10. Test Authentication

- Go to `/auth`
- Register a new account
- Login with existing account
- Redirect to `/admin` after login

### 11. Test Admin Dashboard (`/admin`)

- Access denied if not logged in
- Dashboard loads if logged in

---

## Scripts

| Command | Description |
|-------- |-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Lint code |
| `bun run format` | Format code |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed database with sample data |
| `bun run db:studio` | Open database studio |

---

## Authentication

The auth system uses salted scrypt password hashes and JWT tokens stored in HTTP-only cookies. Users can register and log in at `/auth`. Accounts created before password hashing need a new local password; use the bootstrap command below for the initial admin.

Roles:

- **viewer** - Default role
- **editor** - Can edit content
- **admin** - Full access

Create or reset the first local admin account from the terminal. The command prompts for an email and a masked password:

```bash
bun run db:bootstrap-admin
```

Admins can assign editor and admin roles in `/admin`. The admin editor manages the same content tables as the previous portal, including transfer groups, alliance events and leaders, governance sections, and SvS metrics. Edits appear on public pages without a rebuild.

---

## Adding Content

### Seed Data

Edit `db/seed.ts` to customize sample data, then run:

```bash
bun run db:seed
```

### Manual Data

Use the admin panel at `/admin` (when logged in as admin/editor) or directly edit the SQLite database.

---

## Deployment

```bash
# Build for production
bun run build

# Start production server
bun run start
```

The app requires a server environment (not static export) due to server components and API routes.

---

## License

Unofficial community project. Not affiliated with the game publisher.
