# Missing Podo: The Ankara Case

An investigation dashboard that unifies five Jotform data sources (check-ins,
messages, sightings, personal notes, anonymous tips) into a single timeline
and suspicion view, so an investigator can spot **who looks most suspicious**
and **where Podo was last seen** in seconds.

**Author:** Mehmet Kerem Turhan
**Challenge:** Jotform Frontend Challenge — Ankara 2026 (3-hour case study)

---

## How to Run

> Target time to first render: **under 60 seconds** on a clean machine.

**Prerequisites:** Node 20 LTS (Node 18+ works), npm 9+.

```bash
# 1. Install dependencies
npm install

# 2. Configure the Jotform API key
cp .env.example .env.local
# then open .env.local and set VITE_JOTFORM_API_KEYS to your key:
#   VITE_JOTFORM_API_KEYS=your_jotform_api_key
# A comma-separated list of keys is also supported; the client
# transparently falls back to the next key on 401 / 403 / 429.

# 3. Run in development
npm run dev
# open the printed http://localhost:5173 URL

# --- OR build + preview the production bundle ---
npm run build
npm run preview
```

> The app reads **`VITE_JOTFORM_API_KEYS`** at runtime from `.env.local`.
> `.env.local` is git-ignored and must never be committed.

---

## Features (mapped to the challenge criteria)

- **Data Fetching** — Five Jotform submission endpoints are fetched in
  parallel via a single `@tanstack/react-query` layer, with per-source
  status tracking so a single failed source does not take down the UI.
- **Record Linking** — Records from all five sources are normalised into a
  unified `BaseRecord` shape and keyed by a name-normalised identity, so
  "Ayşe K.", "ayse k" and "AYSE K" fold into one person.
- **Investigation UI** — A two-pane layout: a ranked list of people on the
  left (sorted by suspicion, then recency, then name) and a per-person
  dossier on the right (summary cards, source breakdown, timeline).
- **Search / Filter** — Debounced full-text search across names, locations
  and record content; source-type chips; an "only Podo mentions" toggle;
  and a fast "clear filters" escape hatch.
- **Detail View** — Selecting a person opens a dossier with "last seen",
  "known associates", suspicion-score breakdown with tooltip, and a full
  chronological timeline grouped by day.
- **State Handling** — First-class loading skeletons, empty states,
  full-error state, and a non-blocking **partial-error banner** when some
  sources fail but others succeed.
- **Deep-linkable selection** — The selected person is encoded in the URL
  hash (`#person=<key>`), so a sighting can be shared with a teammate.
- **Keyboard navigation** — `/` focuses search, `Esc` clears it, `↑ / ↓`
  move the selection through the ranked list.

---

## Tech Stack

- **Build:** Vite 5
- **UI:** React 18 + TypeScript (strict)
- **Styling:** Tailwind CSS 3 with a small UI primitive layer (`Button`,
  `Badge`, `Card`, `EmptyState`, `ErrorState`, `Skeleton`, `Tooltip`)
- **Data:** `@tanstack/react-query` v5 over a hand-rolled Jotform client
- **Dates:** `date-fns`
- **Icons:** `lucide-react`
- **Lint / format:** ESLint 9 (typescript-eslint 8), Prettier 3

No UI kit, no state-management library beyond React Query: the shape of
the problem did not need either.

---

## Design Decisions

- **Two-pane investigation layout.** The core job is "rank people, then
  drill in". A list + dossier pattern is the fastest path to that; a
  three-pane layout or a map-first view would have traded clarity for
  novelty inside a 3-hour budget.
- **Name-normalised record linking, not fuzzy matching.** Lowercasing +
  Turkish diacritic folding + whitespace collapse covers the real
  collisions in this dataset. Fuzzy matching (Levenshtein / Jaro-Winkler)
  was scoped out as a bonus: it adds risk without materially improving
  the five test cases in the data.
- **Transparent, weighted suspicion score.** The raw score is
  `3×sightingsWithPodo + 2×messagesWithPodo + 2×tipsAboutThem +
  1×checkinsNearPodo + 1×notesMentioningPodo − 1×unrelatedPenalty`,
  then linearly scaled to 0–100 with a floor of 10 so small corpora do
  not peg everyone at 100. The exact breakdown is visible in the dossier
  tooltip — the user can always audit *why* a suspect ranks where they do.
- **Resilient Jotform client.** A single comma-separated env value
  (`VITE_JOTFORM_API_KEYS`) lets the client try multiple keys and fall
  back on `401 / 403 / 429`, which matches how rate-limited API keys were
  distributed during the event. Each source is a separate React Query,
  so the UI can degrade gracefully instead of failing as a whole.
- **Timeline over map.** The provided data sources carry free-text
  locations but no geo-coordinates, so a map view would have to
  geocode at runtime — not worth the risk. A grouped-by-day timeline
  conveys the same "last-seen-with" narrative with zero ambiguity.
- **URL-hash deep-linking.** Selection lives in the URL (`#person=...`)
  so jurors / teammates can share a specific dossier by copy-pasting
  the address bar.

---

## Known Limitations

- **No map view.** The source data has no geo-coordinates and runtime
  geocoding was out of scope for a 3-hour build.
- **No fuzzy matching.** Record linking is exact-after-normalisation.
  Typo-level variants ("Ayse Kya" vs "Ayse Kaya") stay separate.
- **Client-only search.** Search, filtering, and scoring all run on the
  client over the full submission set. This is fine at the data volumes
  in the challenge, but would need server-side paging at scale.
- **No persistence.** Filter state, search, and the selected person reset
  across hard reloads except for the URL-hash selection.

---

## Folder Structure

```
src/
  App.tsx                     Top-level layout, selection state, keyboard nav
  main.tsx                    React Query provider + root render
  index.css                   Tailwind entry
  components/                 Screen-level components
    TopBar.tsx                Search + "only Podo" toggle + refresh
    PeoplePane.tsx            Ranked people list + source filters
    PersonListItem.tsx        One row in the list
    Dossier.tsx               Right-hand detail view
    SummaryCards.tsx          "Last seen", source counts, score breakdown
    Timeline.tsx              Grouped-by-day event feed
    TimelineItem.tsx          One event row
    SourceFilters.tsx         Source-type chips
    PartialErrorBanner.tsx    Non-blocking banner when some sources fail
    ui/                       Small presentational primitives
  hooks/
    useInvestigation.ts       Fetches + merges the five sources
    useFilters.ts             Query / source / onlyPodo filter state
    useKeyboardNav.ts         Global shortcuts
  data/
    types.ts                  BaseRecord / Person / SuspicionBreakdown
    adapters.ts               Per-source Jotform submission -> BaseRecord
    buildPeopleIndex.ts       Aggregation + ranking
  lib/
    jotform.ts                Multi-key fetch client
    normalize.ts              Name normalisation (incl. Turkish diacritics)
    scoring.ts                Suspicion scoring formula
  config/
    forms.ts                  The five Jotform form IDs
  utils/                      cn, date, text helpers
```

---

## Scripts

| Command            | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Vite dev server at `http://localhost:5173` |
| `npm run build`    | Type-check then build the production bundle into `dist/` |
| `npm run preview`  | Serve the production bundle locally       |
| `npm run typecheck`| Strict TypeScript check, no emit          |
| `npm run lint`     | ESLint with `--max-warnings=0`            |
| `npm run format`   | Prettier write (src only)                 |

---

## Security

- API keys live only in `.env.local` and are never committed.
- `.env.example` ships with a placeholder and no real secret.
- No API key is hard-coded anywhere under `src/`.
