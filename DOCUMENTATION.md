# OllieShotz - Complete Technical Documentation

## Overview

OllieShotz is a mobile-first Progressive Web App (PWA) designed to track ice hockey goalie performance in real-time. It enables parents, coaches, and family members to record saves and goals during games and view detailed statistics.

### Key Capabilities

- **Real-time game tracking** - Record saves and goals as they happen
- **Family sharing** - Multiple family members can track the same player
- **Offline support** - Works without internet, syncs when reconnected
- **Team customization** - Custom colors and theming per player
- **Statistics & analytics** - Season stats, trends, and CSV export
- **Cross-device sync** - Updates appear instantly on all connected devices

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16.1.3 (App Router) | React-based web framework |
| Language | TypeScript 5 | Type-safe development |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Database | Supabase (PostgreSQL) | Data persistence |
| Authentication | Supabase Auth (Magic Link OTP) | Email-based login |
| Realtime | Supabase Realtime | Live data sync |
| Offline Storage | IndexedDB (idb 8.0.3) | Offline queue management |
| PWA | next-pwa 5.6.0 | Service worker & caching |
| Deployment | Netlify | Hosting platform |

---

## Application Architecture

### Directory Structure

```
ollie-shotz/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes (public)
│   │   ├── login/                # Magic link login page
│   │   └── callback/             # Auth callback handler
│   ├── (app)/                    # Protected app routes
│   │   ├── dashboard/            # Home/main page
│   │   ├── game/new/             # New game creation
│   │   ├── game/[id]/            # Live game tracking
│   │   ├── game/[id]/summary/    # Game summary view
│   │   ├── history/              # Past games list
│   │   ├── stats/                # Season statistics
│   │   ├── export/               # CSV export page
│   │   ├── settings/             # Profile & family sharing
│   │   ├── setup/                # Initial profile setup
│   │   └── layout.tsx            # App layout wrapper
│   ├── layout.tsx                # Root layout (PWA metadata)
│   ├── page.tsx                  # Root router (redirects)
│   └── manifest.ts               # PWA manifest generator
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── game/                     # Game-specific components
│   ├── Navigation.tsx            # Bottom navigation bar
│   └── Providers.tsx             # Context providers
├── lib/
│   ├── supabase/                 # Supabase client configuration
│   ├── hooks/                    # Custom React hooks
│   ├── context/                  # React context providers
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── offline/                  # Offline sync logic
├── supabase/
│   └── migrations/               # Database schema
└── public/                       # Static assets & PWA icons
```

### Route Groups

**`(auth)/`** - Public authentication routes
- `/login` - Email input for magic link
- `/callback` - Handles magic link redirect and session creation

**`(app)/`** - Protected routes (require authentication)
- `/dashboard` - Main landing page with recent games
- `/game/new` - Create a new game
- `/game/[id]` - Live game tracking interface
- `/game/[id]/summary` - Post-game summary and stats
- `/history` - List of all past games
- `/stats` - Season-wide statistics and trends
- `/export` - CSV data export
- `/settings` - Profile management and family sharing
- `/setup` - First-time profile creation

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
│─────────────────│
│ id (UUID)       │
│ email           │
└────────┬────────┘
         │
         │ owner_id
         ▼
┌─────────────────┐       ┌─────────────────┐
│ child_profiles  │──────▶│ family_members  │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ owner_id (FK)   │       │ child_id (FK)   │
│ name            │       │ user_id (FK)    │
│ team_name       │       │ email           │
│ jersey_number   │       │ status          │
│ primary_color   │       │ role            │
│ secondary_color │       │ invited_at      │
│ created_at      │       │ accepted_at     │
└────────┬────────┘       └─────────────────┘
         │
         │ child_id
         ▼
┌─────────────────┐
│     games       │
│─────────────────│
│ id (PK)         │
│ child_id (FK)   │
│ game_date       │
│ opponent        │
│ location        │
│ periods (JSONB) │
│ status          │
│ notes           │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ game_id
         ▼
┌─────────────────┐
│     events      │
│─────────────────│
│ id (PK)         │
│ game_id (FK)    │
│ event_type      │
│ period          │
│ recorded_at     │
│ synced          │
│ created_by (FK) │
└─────────────────┘
```

### Table Definitions

#### `child_profiles`
Represents a goalie being tracked.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | Foreign key to auth.users (cascade delete) |
| `name` | TEXT | Player's name (required) |
| `team_name` | TEXT | Team name (optional) |
| `jersey_number` | TEXT | Jersey number (optional) |
| `primary_color` | TEXT | Team primary color (default: #1e40af) |
| `secondary_color` | TEXT | Team secondary color (default: #ffffff) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `family_members`
Links users to child profiles they can access.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `child_id` | UUID | Foreign key to child_profiles (cascade delete) |
| `user_id` | UUID | Foreign key to auth.users (nullable until accepted) |
| `email` | TEXT | Invited email address (required) |
| `status` | TEXT | 'pending' or 'accepted' |
| `role` | TEXT | 'owner', 'editor', or 'viewer' |
| `invited_at` | TIMESTAMPTZ | When invitation was sent |
| `accepted_at` | TIMESTAMPTZ | When invitation was accepted (nullable) |

**Constraints:** Unique on (child_id, email)

#### `games`
Individual game records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `child_id` | UUID | Foreign key to child_profiles (cascade delete) |
| `game_date` | DATE | Date of the game (required) |
| `opponent` | TEXT | Opposing team name (required) |
| `location` | TEXT | Game location (optional) |
| `periods` | JSONB | Array of period names (default: ["P1","P2","P3"]) |
| `status` | TEXT | 'upcoming', 'live', or 'completed' |
| `notes` | TEXT | Game notes (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp (auto-updated via trigger) |

#### `events`
Individual save or goal records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `game_id` | UUID | Foreign key to games (cascade delete) |
| `event_type` | TEXT | 'save' or 'goal' (required) |
| `period` | TEXT | Period name (e.g., "P1", "OT") (required) |
| `recorded_at` | TIMESTAMPTZ | When the event was recorded |
| `synced` | BOOLEAN | Whether event has been synced (default: true) |
| `created_by` | UUID | Foreign key to auth.users (nullable) |

---

## Authentication System

### Magic Link Flow

OllieShotz uses Supabase's passwordless authentication via magic links (OTP).

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /login    │────▶│   Supabase  │────▶│    Email    │
│  (enter     │     │   Auth      │     │   (magic    │
│   email)    │     │   Server    │     │    link)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               │ User clicks link
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  /dashboard │◀────│  /callback  │◀────│   Browser   │
│  (or /setup)│     │  (exchange  │     │  (redirect) │
│             │     │   code)     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Step-by-Step Authentication Flow

#### 1. Login Page (`/login`)
- User enters email address
- App calls `supabase.auth.signInWithOtp({ email })`
- Supabase sends magic link to user's email
- User sees "Check your email" message

#### 2. Email Magic Link
- User receives email with link containing OTP code
- Link format: `{app_url}/callback?code={OTP_CODE}`

#### 3. Callback Handler (`/callback`)
- Extracts `code` from URL query parameters
- Exchanges code for session: `supabase.auth.exchangeCodeForSession(code)`
- Performs smart redirect logic:

```
Is user a profile owner?
  └─ YES → Redirect to /dashboard
  └─ NO → Does user have pending family invite matching their email?
            └─ YES → Auto-accept invite → Redirect to /dashboard
            └─ NO → Redirect to /setup (create new profile)
```

#### 4. Session Management
- Session stored in cookies via `@supabase/ssr`
- Middleware validates session on every request
- Protected routes redirect unauthenticated users to `/login`

### Middleware Protection

The middleware (`middleware.ts`) runs on every request:

```typescript
// Protected route patterns
const protectedRoutes = ['/dashboard', '/game', '/settings', '/stats', '/history', '/export', '/setup']

// Middleware logic:
1. Refresh session from cookies
2. If accessing protected route without session → redirect to /login
3. If accessing /login with valid session → redirect to /dashboard
```

### PIN-Based Quick Access (Alternative Login)

For family members who don't want to deal with email authentication, OllieShotz offers a PIN-based quick access system.

#### How It Works

1. **Owner generates PIN** in Settings → Quick Access PIN
2. **6-digit PIN** is displayed once and can be shared with family
3. **Family members** go to `/pin-login` and enter the PIN
4. **Session created** with limited permissions (no settings access)

#### PIN Login Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   /pin-login    │────▶│  /api/pin/      │────▶│   Validate PIN  │
│  (enter 6-digit │     │  verify         │     │   against hash  │
│   PIN)          │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         │ If valid
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   /dashboard    │◀────│   Set session   │◀────│ Create session  │
│   (Quick Access │     │   cookies       │     │ in pin_sessions │
│    Mode)        │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### PIN User Permissions

| Action | Allowed |
|--------|---------|
| View games & stats | Yes |
| Record saves/goals | Yes |
| Create new games | Yes |
| Delete games | No |
| Edit profile/settings | No |
| Manage family members | No |
| Generate/revoke PINs | No |

#### Security Features

- **Hashed storage**: PINs are SHA-256 hashed with salt before storage
- **Rate limiting**: 5 attempts per minute per IP address
- **Session tracking**: All PIN sessions recorded in `pin_sessions` table
- **Instant revocation**: Owner can revoke all PIN sessions from Settings
- **30-day expiry**: PIN sessions automatically expire after 30 days

#### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pin/verify` | POST | Validate PIN and create session |
| `/api/pin/manage` | GET | Get PIN status and session count |
| `/api/pin/manage` | POST | Generate new PIN |
| `/api/pin/manage` | PATCH | Enable/disable PIN |
| `/api/pin/manage` | DELETE | Revoke all PIN sessions |

### Row-Level Security (RLS)

Database-level access control ensures users can only access authorized data:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `child_profiles` | Owner or family member | Owner only | Owner only | Owner only |
| `family_members` | Owner or self | Owner only | Owner or self | Owner only |
| `games` | Has child access | Has child access | Has child access | Owner only |
| `events` | Has child access | Has child access | Has child access | Has child access |

**Helper Function:** `user_has_child_access(child_id)`
- Returns TRUE if user is owner OR has accepted family membership

---

## Family Sharing System

### Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full control: edit profile, manage family, delete games, record events |
| **Editor** | Record saves/goals, view all data |
| **Viewer** | Read-only access (defined in schema, not enforced in UI) |

### Invitation Flow

```
┌──────────────────┐
│  Owner opens     │
│  /settings       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Enters family   │
│  member's email  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Creates record  │
│  in family_      │
│  members with    │
│  status='pending'│
└────────┬─────────┘
         │
         │ (Family member receives notification externally)
         ▼
┌──────────────────┐
│  Family member   │
│  logs in via     │
│  magic link      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  /callback       │
│  detects pending │
│  invite, auto-   │
│  accepts         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Family member   │
│  sees shared     │
│  profile on      │
│  dashboard       │
└──────────────────┘
```

---

## Game Tracking System

### Game Lifecycle

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│upcoming │────▶│  live   │────▶│completed│
└─────────┘     └─────────┘     └─────────┘
   (future       (tracking       (ended,
    games)        in progress)    archived)
```

### Creating a Game (`/game/new`)

1. Select date
2. Enter opponent name
3. Optionally set location
4. Configure periods (default: P1, P2, P3; can add OT, SO)
5. Game created with status='live'
6. Redirects to live tracking

### Live Tracking (`/game/[id]`)

The live tracker interface provides:

- **Period selector** - Switch between periods
- **Save button** - Large green button to record saves
- **Goal button** - Red button to record goals against
- **Event list** - Scrollable list of recorded events
- **Live stats** - Current save percentage and counts
- **Undo** - Delete last event

### Event Recording Flow

```typescript
// Optimistic update pattern
1. Generate temporary ID (temp-{uuid})
2. Add event to UI immediately (optimistic)
3. Send INSERT to Supabase
4. On success: Replace temp ID with real ID, track for deduplication
5. On failure: Remove event from UI (rollback)
```

### Realtime Synchronization

Multiple users tracking the same game see updates instantly:

```typescript
// Supabase Realtime subscriptions
channel
  .on('postgres_changes', { event: 'INSERT', table: 'events' }, handleNewEvent)
  .on('postgres_changes', { event: 'DELETE', table: 'events' }, handleDeleteEvent)
  .on('postgres_changes', { event: 'UPDATE', table: 'games' }, handleGameUpdate)
  .subscribe()
```

**Deduplication Logic:**
- Tracks IDs of events created by current user
- Ignores realtime events for IDs already in local state
- Prevents duplicate entries when own action echoes back

---

## Offline Support

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Action   │────▶│  Online Check   │────▶│   Supabase DB   │
│   (save/goal)   │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ If offline
                                 ▼
                        ┌─────────────────┐
                        │   IndexedDB     │
                        │   Queue         │
                        └────────┬────────┘
                                 │
                                 │ When online
                                 ▼
                        ┌─────────────────┐
                        │   Sync Worker   │
                        │   (processes    │
                        │    queue)       │
                        └─────────────────┘
```

### Queue Structure

```typescript
interface QueuedAction {
  id: string           // Unique action ID
  type: 'create_event' | 'delete_event'
  payload: {
    game_id: string
    event_type?: 'save' | 'goal'
    period?: string
    event_id?: string  // For deletes
  }
  created_at: number   // Timestamp
  synced: boolean      // Sync status
}
```

### Sync Process

1. **Detection:** `navigator.onLine` and `window.addEventListener('online', ...)`
2. **Processing:** When online, read unsynced items from IndexedDB
3. **Execution:** Process actions in order (FIFO)
4. **Cleanup:** Mark as synced or remove after successful sync
5. **Error Handling:** Failed items remain for retry

---

## Statistics System

### Calculations

**Save Percentage:**
```
Save % = (Total Saves / Total Shots) × 100
Total Shots = Saves + Goals
```

**GPA Format:**
Converts save percentage to a familiar "GPA" scale for parents:
```
GPA = Save % / 10
Example: 90% save rate = 9.0 GPA
```

### Statistics Views

#### Game Summary (`/game/[id]/summary`)
- Total saves and goals
- Save percentage
- Per-period breakdown
- Event timeline

#### Season Stats (`/stats`)
- Aggregate stats across all completed games
- Games played count
- Total saves and goals
- Overall save percentage
- By-period breakdown
- Trend chart (last 10 games)

#### CSV Export (`/export`)
- Download game data as CSV
- Includes: date, opponent, saves, goals, save %
- Useful for external analysis

---

## Theming System

### Team Colors

Six predefined color schemes:

| Name | Primary | Secondary | Special |
|------|---------|-----------|---------|
| Blue | #1e40af | #ffffff | - |
| Hawks | #c8102e | #000000 | Watermark logo |
| Green | #166534 | #ffffff | - |
| Purple | #7c3aed | #ffffff | - |
| Orange | #ea580c | #ffffff | - |
| Black | #171717 | #ffffff | - |

### CSS Variable System

```css
:root {
  --primary: /* from team color */
  --primary-light: /* lighter variant */
  --team-primary: /* team primary */
  --team-secondary: /* team secondary */
  --background: #ffffff;
  --foreground: #171717;
  --muted: #737373;
  --border: #e5e5e5;
  --save-green: #16a34a;
  --goal-red: #dc2626;
}
```

### TeamColorContext

React context that:
1. Reads `primary_color` and `secondary_color` from child profile
2. Sets CSS custom properties on document root
3. Components use `var(--primary)` for consistent theming

---

## PWA Features

### Capabilities

- **Installable** - Add to home screen on mobile
- **Offline** - Service worker caches app shell
- **Fast** - Cached assets load instantly
- **Native feel** - Full-screen, no browser chrome

### Configuration

```typescript
// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
})
```

### Manifest (`app/manifest.ts`)

```typescript
{
  name: 'OllieShotz',
  short_name: 'OllieShotz',
  description: 'Track goalie performance',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#1e40af',
  icons: [/* various sizes */]
}
```

---

## Key Hooks

### `useChildProfile()`
Fetches the current user's child profile (owned or shared).

```typescript
const { profile, loading, error } = useChildProfile()
```

### `useGame(gameId)`
Manages game state with realtime updates.

```typescript
const {
  game,           // Game data
  events,         // Event list
  addEvent,       // Record save/goal
  deleteEvent,    // Remove event
  endGame,        // Mark completed
  loading,
  error
} = useGame(gameId)
```

### `useOfflineSync()`
Handles offline queue and synchronization.

```typescript
const {
  isOnline,       // Network status
  pendingCount,   // Unsynced items
  syncNow         // Force sync
} = useOfflineSync()
```

---

## Environment Configuration

### Required Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for PIN authentication
```

> **Note**: The `SUPABASE_SERVICE_ROLE_KEY` is required for PIN-based authentication. Find it in your Supabase dashboard under Settings → API → Service Role Key. Keep this key secret and never expose it client-side.

### Supabase Dashboard Settings

**Authentication:**
- Site URL: Production domain
- Redirect URLs: Include `{domain}/callback`
- Email templates: Customize magic link email

**Database:**
- Run migration SQL
- Enable RLS on all tables
- Enable Realtime for `events` and `games` tables

---

## Development & Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# App runs at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deployment (Netlify)

The app is configured for Netlify deployment:

1. Connect repository to Netlify
2. Set environment variables in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `.next`

---

## Security Considerations

### Authentication Security
- No passwords stored (magic link only)
- Session tokens in HTTP-only cookies
- Server-side session validation

### Data Security
- Row-Level Security at database level
- Users can only access owned or shared data
- Cascade deletes prevent orphaned data

### Input Validation
- TypeScript types enforce data shapes
- Supabase validates against schema
- Client-side validation for UX

### Best Practices
- No sensitive data in client-side code
- Environment variables for secrets
- HTTPS enforced in production

---

## Troubleshooting

### Magic Link Not Working
1. Check spam folder
2. Verify Supabase email settings
3. Confirm redirect URLs in Supabase dashboard
4. Check browser console for errors

### Realtime Not Updating
1. Verify Realtime is enabled for tables in Supabase
2. Check browser console for WebSocket errors
3. Confirm RLS policies allow SELECT

### Offline Sync Issues
1. Check IndexedDB in browser DevTools
2. Verify service worker is registered
3. Monitor network tab for failed requests

### Profile Not Loading
1. Verify user has owner or family access
2. Check RLS policies
3. Confirm database has data
