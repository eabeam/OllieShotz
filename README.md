# OllieShotz

A mobile-first PWA for tracking ice hockey goalie saves and goals in real-time. Features offline support, family sharing, and configurable team colors.

## Features

- **Live Game Tracking**: Big, easy-to-tap Save/Goal buttons with instant stats
- **Flexible Periods**: Configure P1, P2, P3, OT, SO, or custom period names
- **Family Sharing**: Invite family members via email to track games together
- **Real-time Sync**: Multiple users see updates instantly via Supabase Realtime
- **Offline Support**: Track games without internet, syncs when back online
- **CSV Export**: Export game data for individual games or full season
- **PWA**: Add to home screen for native app-like experience

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Offline**: IndexedDB via idb library

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd OllieShotz
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

### 3. Run Database Migrations

1. Open your Supabase project's SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in the SQL Editor

### 4. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get your credentials from Supabase Project Settings > API:
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key

### 5. Configure Auth

In Supabase Dashboard > Authentication > URL Configuration:
- Set Site URL to `http://localhost:3000` (dev) or your production URL
- Add `http://localhost:3000/callback` to Redirect URLs

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## PWA Icons

Replace the placeholder icon in `public/icons/` with your own:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

You can use the included `icon.svg` as a template.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Update Supabase Auth redirect URLs for your production domain

### Manual Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── (auth)/           # Login and auth callback
├── (app)/            # Protected app routes
│   ├── dashboard/    # Home screen
│   ├── game/         # Game creation and live tracking
│   ├── history/      # Past games list
│   ├── export/       # CSV export
│   └── settings/     # Profile, colors, family sharing
components/
├── ui/               # Reusable UI components
└── game/             # Game-specific components
lib/
├── supabase/         # Supabase client config
├── hooks/            # React hooks
├── utils/            # Utility functions
└── offline/          # IndexedDB offline queue
supabase/
└── migrations/       # SQL schema
```

## License

MIT
