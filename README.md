# F1 World Chronicle

A long-running Formula racing universe built with Vite and React. It follows an F1-style information architecture while treating the championship as a living world: procedural drivers and staff, feeder categories, alternative careers, changing sponsors, evolving technical orders, protected historic teams and circuits, and a permanent statistical archive.

Real constructor, engine and sponsor brands are used as fictional-universe identities and partnerships. Every driver and staff member is procedural.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Simulation-only smoke test, which does not require React or Vite packages:

```bash
npm run smoke
```

## Implemented world

### Series and careers

- Formula 1: full weekend and championship detail
- Formula 2 and Formula 3: active feeder grids, standings, champions and promotion logic
- Formula E and WEC: alternative, recovery and late-career destinations
- Abstract Regional/F4 and karting backgrounds for newly generated F3 prospects
- Academies, reserves, contracts, seat pressure, promotions, demotions, retirements and cross-series moves
- Stable grid refill logic across many seasons

### Procedural rarity model

The launch F1 field contains 22 drivers:

- 2 Generational
- 4 Legend
- 6 Epic
- 6 Rare
- 3 Uncommon
- 1 Common

F2, F3, Formula E and WEC use their own lower-pyramid distributions. Rarity and base talent never change. Annual form, confidence, age, career phase and the pre-generated career curve change effective performance.

### Race weekends

- Standard and Sprint weekend formats
- Three practice sessions or the appropriate Sprint structure
- Q1, Q2 and Q3 elimination logic
- Independent weather for every session
- Dynamic race weather timeline with dry, damp and wet track states
- Soft, Medium, Hard, Intermediate and Wet tyre behavior
- Track crossover timing, tyre degradation, pit stops and strategy quality
- Starts, traffic, overtaking difficulty and circuit-specific car fit
- Mechanical failures, driver incidents, penalties, Safety Cars, Virtual Safety Cars and red flags
- Contextual team orders during late-season title fights
- Official Grand Prix and Sprint points structures

A wet qualifying session can promote a wet-weather specialist well above the expected order even when the race is forecast dry. A dry qualifying session can likewise be followed by a wet race in which tyre timing, composure and wet skill become decisive.

### Constructors and organizations

- Eleven launch constructors with recognizable brand identities
- Protected heritage logic so Ferrari-like institutions do not casually disappear
- Plausible acquisitions and rebrands for vulnerable entries
- Power-unit suppliers, engine trajectories and occasional supplier changes
- Eight car-performance dimensions and circuit-specific strengths
- Facilities, development packages, correlation failures and regulation-cycle resets
- Team principal, sporting director, technical director, strategy head and two race engineers per F1 team
- Staff rarity, specialties, contracts, poaching, wins, titles and employment history

### Commercial layer

- Main and secondary sponsors
- Sponsor country, value and color identity
- Driver commercial value and sponsor-country fit
- Financially vulnerable teams placing more weight on marketability without ignoring sporting ability
- Dynamic lead-partner changes and livery history

### Calendar and history

- Protected classics such as Monaco, Monza, Silverstone and Spa
- Conservative calendar rotation from an international reserve pool
- One controlled change in a typical off-season rather than constant churn
- Permanent team lineage, livery, staff and driver histories
- Compressed race archives with winners, podiums, weather, interventions and fastest laps
- Awards for F1 and support-series champions, wet-weather performance, qualifying, overtaking, pit crews and innovation
- Transparent GOAT modes for F1 legacy, all motorsport, peak and longevity

### Interface and saves

- F1-inspired responsive navigation
- Home, Schedule, Weekend, Results, Standings, Drivers, Teams, Paddock, World, Almanac and More
- Driver, team and circuit profile overlays
- Paddock magazine stories generated from sporting, technical, commercial and market events
- Three IndexedDB save slots, autosave, delete, JSON export and JSON import
- Commissioner settings for calendar churn, team dynamism, authenticity and autosave

## Important design rule

The game separates intrinsic quality from circumstances:

```text
Effective performance = fixed base talent
                      × fixed career curve for the current age
                      × annual form
                      + confidence, experience and specialist-skill effects
                      + car, circuit, weather, strategy and operational context
```

A Generational driver remains Generational. They can still lose through an inferior car, bad strategy, reliability, weather timing or a poor career year, but the simulation does not silently rewrite their underlying rarity.

## Project structure

```text
src/data.js       universe generation, teams, drivers, staff, sponsors and circuits
src/sim.js        sessions, races, standings, stories, awards and off-season evolution
src/storage.js    IndexedDB slots and JSON import/export
src/main.jsx      application pages, tables, profiles and controls
src/styles.css    responsive F1-inspired visual system
scripts/smoke.mjs multi-season deterministic integrity test
```

See `IMPLEMENTATION.md` for the design-document coverage map and current prototype boundaries.
