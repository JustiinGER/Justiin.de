# Justiin.de — Personal Portfolio

Personal portfolio site of **Justin** — IT System Technician, self-hosting enthusiast and tech explorer. Built with Next.js 16 and React 19, the site pulls live data from a homelab (ADS-B receiver, BirdNET-Go, Uptime Kuma, Steam) and falls back to demo mode when no endpoints are configured.

Live: [justiin.de](https://justiin.de)

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for animations
- [lucide-react](https://lucide.dev) & [react-icons](https://react-icons.github.io/react-icons/) for icons
- [next-themes](https://github.com/pacocoursey/next-themes) for light/dark mode

## Features

- **Hero** with live scroll progress and theme toggle
- **Lab** section showing live stats from homelab services
- **Passions**, **Gear** and **Tech Stack** sections
- Server-side API proxies (`/api/adsb`, `/api/birds`, `/api/steam`, `/api/uptime`, `/api/ping`) so secrets never reach the client
- Graceful fallback to a "Demo" indicator when endpoints are not configured

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment variables

Copy the example file and fill in the values for your own services:

```bash
cp .env.local.example .env.local
```

Any variable you leave empty will cause that widget to display a "Demo" badge instead of live data. See `.env.local.example` for the full list (ADS-B, BirdNET-Go, Steam, Uptime Kuma).

## Scripts

| Command         | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `npm run dev`   | Start the dev server on `http://localhost:3000`                       |
| `npm run build` | Build the production bundle                                           |
| `npm run start` | Start the production server (`SERVER_PORT` env overrides the port)    |
| `npm run lint`  | Run ESLint                                                            |

## Project Structure

```
src/
  app/
    api/         # Server-side proxies (adsb, birds, steam, uptime, ping)
    layout.tsx   # Root layout (theme, background, scroll progress)
    page.tsx     # Landing page composition
  components/    # Hero, Lab, Passions, Gear, TechStack, UI primitives
  lib/           # Data, motion presets, server-only helpers, utils
public/          # Static assets
```

## Deployment

Designed to run behind a reverse proxy in a homelab or on [Vercel](https://vercel.com). Set the required environment variables on the host and run `npm run build && npm run start`. The start script honors `SERVER_PORT` if you need a non-default port.

## License

Personal project — all rights reserved unless stated otherwise.
