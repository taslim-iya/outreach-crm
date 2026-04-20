# Venture Scout — No-Website Business Finder

A lead generation tool for web designers and digital agencies. Find local businesses that don't have a website (or have a poor one), manage your outreach pipeline, and generate AI-powered website mockups to win clients.

**Live Demo:** [venture-scout-lac.vercel.app](https://venture-scout-lac.vercel.app)

## Features

### Search & Discovery
- **Google Places search** — Find businesses without websites in any city, by category
- **Poor website detection** — Identify businesses with slow, broken, or insecure sites
- **Search caching** — Results are cached so repeat searches are instant
- **Search history** — Browse and reload previous searches
- **CSV upload** — Bulk-import businesses from spreadsheets
- **Single business lookup** — Check any business name or domain individually
- **Demo data** — Try the app without API keys using built-in sample businesses

### Lead Management
- **Save leads** — Bookmark interesting businesses from search results
- **Outreach pipeline** — Track leads through stages: Not Contacted → Contacted → Interested → Won
- **Clickable status badges** — Click to cycle through stages, or use the dropdown for precise control
- **Notes** — Add private notes to any lead
- **Email finder** — Discover business email addresses via Hunter.io integration
- **Duplicate detection** — Batch uploads show "X saved, Y skipped" for existing leads
- **CSV export** — Download all saved leads as a CSV file

### Dashboard & Analytics
- **KPI cards** — Total leads, emails found, searches run, conversion rate
- **Outreach pipeline** — Visual funnel showing leads at each stage
- **Recent activity feed** — Live feed of last 5 saved leads with time-ago timestamps
- **Top categories & cities** — Bar charts showing where your leads cluster

### AI Website Generator (Mock Builder)
- **GPT-4o powered** — Generates complete, professional single-page HTML websites
- **Business type presets** — One-click setup for 10 common business types (Plumber, Restaurant, etc.)
- **Load from leads** — Auto-fill business details from your saved leads
- **Style customization** — 8 accent colors and 6 layout styles
- **Live preview** — See the generated website in a browser-style frame
- **Download & copy** — Export as HTML file or copy to clipboard

### Business Cards
- **Google Maps link** — Click any address to open in Google Maps
- **Click-to-call** — Phone numbers are `tel:` links for mobile
- **Copy Pitch** — One-click generates a personalized outreach message
- **Copy Info** — Copy all business details to clipboard
- **Website analysis** — For poor websites, see issues, score, and recommendations

### UX Polish
- **Active nav highlighting** — Current page indicated with cyan accent + underline
- **Search persistence** — Last search (city, category, mode) saved to localStorage
- **Live/Cached badges** — Know whether results are fresh from the API or from cache
- **Result count** — "X businesses" pill shown next to search results
- **Loading skeletons** — Shimmer animations during data fetches
- **Empty states** — Helpful suggestions when no results are found

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| State | React Query (TanStack Query) |
| Database | Supabase (PostgreSQL + Auth + Edge Functions) |
| Search API | Google Places API (via Supabase edge function) |
| AI | OpenAI GPT-4o (via Vercel API route) |
| Email Finder | Hunter.io (via Supabase edge function) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- A Supabase project with the required tables (`saved_leads`, `search_cache`)
- API keys for Google Places and optionally OpenAI / Hunter.io

### Installation

```bash
# Clone the repository
git clone https://github.com/taslim-iya/no-web-venture-scout.git
cd no-web-venture-scout

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

The following are configured at runtime in the app:
- **OpenAI API Key** — Entered in the Mock Builder settings panel (stored in localStorage)
- **Google Places API Key** — Configured in your Supabase edge function
- **Hunter.io API Key** — Configured in your Supabase edge function

### Scripts

```bash
npm run dev       # Start dev server (port 8080)
npm run build     # Production build
npm run lint      # Run ESLint
npm run test      # Run tests with Vitest
```

## Screenshots

> Screenshots coming soon.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── BusinessCard  # Lead result card with actions
│   ├── SearchPanel   # City/category/mode search form
│   ├── HeroSection   # Landing hero with live stats
│   ├── EmptyState    # No-results state with suggestions
│   └── ...
├── pages/            # Route-level page components
│   ├── Index         # Main search page
│   ├── Dashboard     # Analytics & activity feed
│   ├── Outreach      # Lead pipeline management
│   ├── BatchUpload   # Bulk CSV/manual import
│   └── MockBuilder   # AI website generator
├── lib/              # API clients & utilities
│   ├── placesApi     # Google Places search
│   ├── savedLeadsApi # Lead CRUD operations
│   ├── searchCacheApi# Search result caching
│   ├── hunterApi     # Email finder
│   ├── exportLeadsApi# CSV export
│   └── websitePrompt # AI prompt builder
├── data/             # Static data & types
└── integrations/     # Supabase client config
```

## License

MIT
