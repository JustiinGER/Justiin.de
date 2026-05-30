# Justiin.de — Personal Page

Personal page of **Justin** — IT System Technician, self-hosting enthusiast and tech explorer. Built with Next.js 16 and React 19, the site pulls live data from a homelab (ADS-B receiver, BirdNET-Go, Uptime Kuma, Steam), stores editable content in MariaDB, and falls back to static defaults when services are not configured.

Live: [justiin.de](https://justiin.de)

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for animations
- [MariaDB](https://mariadb.org) via [mysql2](https://github.com/sidorares/node-mysql2) for content and admin auth
- [lucide-react](https://lucide.dev) & [react-icons](https://react-icons.github.io/react-icons/) for icons
- [next-themes](https://github.com/pacocoursey/next-themes) for light/dark mode
- [@dnd-kit](https://dndkit.com) for drag-and-drop in the admin panel

## Features

### Public site

- **Hero**, **Lab**, **Passions**, **Gear**, **Contact**, and **Tech Stack** sections
- Content loaded from MariaDB with deep-merge over `src/lib/data.ts` defaults; falls back to defaults if the database is unavailable
- Server-side API proxies (`/api/adsb`, `/api/birds`, `/api/steam`, `/api/uptime`, `/api/ping`) so secrets never reach the client
- Graceful fallback to a "Demo" indicator when homelab endpoints are not configured
- Display settings panel (theme + reduced motion) and a GDPR-oriented [privacy policy](/privacy)
- Homepage revalidates every 60 seconds

### Admin panel (`/admin`)

- JWT-based login with bcrypt password hashing and rate limiting
- **Content** — edit About Me, Lab, Passions, Gear, and Contact via forms, JSON editor, or split view with live preview; drag-and-drop reordering for list items
- **Monitor** — database and widget health, content version history (restore, pin, diff view), and admin activity log
- **Settings** — change admin password and theme preference
- Auto-logout on session expiry

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- MariaDB (optional — required only for the admin panel and DB-backed content)

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

Copy the example file and fill in the values for your setup:

```bash
cp .env.local.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MariaDB connection for admin auth and site content |
| `JWT_SECRET` | Signing secret for admin sessions (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `ADSB_ENDPOINT`, `RECEIVER_LAT`, `RECEIVER_LON` | ADS-B aircraft data |
| `BIRDNET_ENDPOINT` | BirdNET-Go species analytics |
| `STEAM_API_KEY`, `STEAM_ID` | Recently played Steam games |
| `UPTIME_KUMA_ENDPOINT`, `UPTIME_KUMA_SLUG` | Homelab service status |

Any homelab variable you leave empty will cause that widget to display a "Demo" badge instead of live data. Without database variables, the site still runs using `data.ts` defaults and the admin panel is unavailable.

### Admin setup

1. Create a MariaDB database and add the connection details to `.env.local`.
2. Run the setup script to create tables and an admin user:

```bash
npx tsx scripts/setup-admin.ts
```

Use `--reset` to change the password for an existing admin user:

```bash
npx tsx scripts/setup-admin.ts --reset
```

3. Sign in at [http://localhost:3000/admin](http://localhost:3000/admin).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on `http://localhost:3000` |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server (`SERVER_PORT` env overrides the port) |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  app/
    admin/           # Admin login, content editor, monitor, settings
    api/
      admin/         # Auth, content CRUD, history, logs, health
      adsb/          # ADS-B proxy
      birds/         # BirdNET-Go proxy
      steam/         # Steam API proxy
      uptime/        # Uptime Kuma proxy
      ping/          # Health check
    privacy/         # Privacy policy page
    layout.tsx       # Root layout (theme, background, scroll progress)
    page.tsx         # Landing page composition
  components/        # Public sections, admin forms, UI primitives
  hooks/             # Client hooks (e.g. auto-logout)
  lib/               # Content layer, auth, JWT, DB, data defaults, utils
  proxy.ts           # Edge auth guard for protected admin routes
scripts/
  setup-admin.ts     # One-time DB schema + admin user setup
public/              # Static assets and PWA manifest
```

## Deployment

Designed to run behind a reverse proxy in a homelab or on [Vercel](https://vercel.com). Set the required environment variables on the host, run the admin setup script against your MariaDB instance, then `npm run build && npm run start`. The start script honors `SERVER_PORT` if you need a non-default port.

## License

Personal project — all rights reserved unless stated otherwise.
