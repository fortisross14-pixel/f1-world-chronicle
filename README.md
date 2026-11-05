# F1 World Chronicle

A long-running procedural motorsport universe built with Vite and React. The interface borrows the information architecture of Formula 1, but the game world extends far beyond a single championship: F4 prospects rise through F3 and F2, displaced stars rebuild in Formula E or WEC, constructors enter and leave, sponsors reshape budgets and liveries, and every season becomes part of a permanent statistical history.

Real automotive, engine and sponsor brands are used as fictional-universe identities and partnerships. All drivers and staff are procedural.

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

Simulation-only integrity tests, which do not require React or Vite packages:

```bash
npm run smoke
npm run deterministic
npm run universe-v4
npm run universe-v5
npm run cash-analysis
npm run balance-12
npm run race-replay
npm run legacy-calibration
```

`balance-12` and `legacy-calibration` are long runs. `legacy-calibration` simulates three universes for 30 seasons each in parallel child processes.

## GitHub Pages deployment

This repository is ready for GitHub Pages through GitHub Actions.

1. Push the project to the repository's `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Open the **Actions** tab and allow the `Deploy F1 World Chronicle` workflow to finish.

Do not publish the source folder directly. Vite must build the site first and GitHub Pages must publish the generated `dist` folder. The included `vite.config.js` detects the GitHub repository name and builds assets under `/<repository-name>/`. The workflow invokes Vite through Node directly, avoiding Linux executable-permission failures from `node_modules/.bin/vite`.

The browser-console message about an asynchronous listener or a closed message channel is commonly produced by a browser extension. It is separate from the application unless it remains in a clean incognito profile with extensions disabled.

## The universe launcher

The application opens on a dedicated universe screen rather than entering a pre-generated season automatically.

- Three independent IndexedDB universe slots
- Create, load and permanently delete controls
- Universe names and last-played metadata
- Explicit save and return-to-slots controls
- Autosave without the small `localStorage` quota
- Portable JSON export and import
- Schema checks that prevent an older prototype save from crashing a newer build

Schema v14 adds lap-by-lap replays, the showcase gate, sporting rivalries and the Hall of Fame. Saves from v13 load normally and show their existing results without a replay. Schema v10 added the global Generational-talent lifecycle, stronger driver archetypes, circuit conversion and long-run championship balancing. The hydration layer upgrades recent universe saves, adds missing staff/facility fields and rebuilds driver hierarchy, but very early prototype saves should be exported before switching builds.

## Complete driver world

The Drivers page is a universe database rather than an F1 roster screen. It contains every active and historical driver and can be filtered by:

- Formula 1
- Formula 2
- Formula 3
- Formula 4
- Formula E
- WEC
- Free agents
- Test drivers
- Retired drivers

Every row includes a procedural name, nationality flag, rarity, current category or role, team, age, visible current rating and current-season results. Search, rarity filters and sorting make it possible to follow two elite prospects from F4 through their entire careers, or find a former Generational F1 champion now racing in Formula E.

### Rarity and team knowledge

Rarity and fixed base talent are visible to the player because this is a universe chronicle. Teams do **not** see those hidden classifications or future career multipliers. Recruitment decisions use current observed ability, recent results, salary, commercial value, academy knowledge and sponsor fit.

A team can therefore overpay for a driver performing at a 1.01 career multiplier immediately before that driver's curve falls to 0.92, or sign an overlooked young Legend before the rest of the paddock understands how good they are.

Generational talent is controlled across the **entire universe**, not allocated separately to each grid. A new universe normally starts with exactly one Generational driver, who may already be in F1 or may begin in F2, F3 or F4. Across later seasons:

- The active universe can contain 0, 1 or 2 Generational drivers.
- One is the normal state.
- A second overlapping career is deliberately rare.
- After the last one retires, the universe can spend time with none before another appears.

Legend, Epic, Rare, Uncommon and Common distributions remain deeper in every category. Old schema saves with excessive Generational counts are normalized to a maximum of two while preserving the two strongest established careers.

## Competitions

F1, F2, F3, F4, Formula E and WEC are first-class competitions. Each competition page has five views:

- **Overview:** current leader, leading team, most recent winner and championship snapshot
- **Current Year:** every scheduled event in a race-by-race table with winner, second, third, winning team, pole and fastest lap
- **Standings:** separate driver and team tables plus current wins, poles, podium and ability leaders
- **History:** yearly driver champion, points total and team champion
- **Stats:** accumulated titles, wins, points, poles, podiums and starts

This makes feeder categories navigable histories rather than invisible background calculations.


## Detail pages and season controls

Driver and team records use full pages with browser-history navigation rather than stacked modals. Driver pages contain **Overview**, **Current Season**, **Career** and **Transfers** tabs. The Overview shows current effective skills and a numerical year-by-year career curve, keeping raw ceiling separate from current performance.

Team pages contain **Overview**, **Personnel**, **Finance** and **History** tabs. Their yearly history records team name, director, championship position, points, engine and both drivers with individual points and positions.

A sticky world-time bar remains above the navigation on desktop and mobile. It always exposes **+1 week**, **+4 weeks** and **Year end**, then changes to **Move to next year** after all six championships finish.

The initial and off-season F1 markets enforce a minimum race-driver age of 21. A driver reaching F1 at 21 must be an elite prospect and begins on a reduced early-career multiplier rather than receiving peak skills immediately.

## Race weekends and weather

- Standard and Sprint weekend formats
- Practice sessions and car-setup feedback
- Q1, Q2 and Q3 elimination logic
- Independent weather for practice, qualifying, Sprint and race sessions
- Dynamic race timelines with dry, damp and wet phases
- Soft, Medium, Hard, Intermediate and Wet tyre behavior
- Crossover timing, tyre degradation, pit windows and strategy errors
- Starts, traffic, overtaking difficulty and circuit-specific car fit
- Mechanical failures, incidents, penalties, Safety Cars, Virtual Safety Cars and red flags
- Contextual team orders in title situations
- Formula-style Grand Prix and Sprint points

Weather is a core competitive axis rather than a cosmetic random event. A wet-weather specialist can qualify unusually high in rain, then lose that advantage in a dry race. A driver who qualifies poorly on Saturday can become exceptional when rain reaches the circuit on Sunday. Wet skill, composure, strategist quality, pit-wall timing and tyre crossover all affect the result independently.

Driver archetypes now create separate Saturday and Sunday profiles. A Qualifying specialist can collect poles through exceptional one-lap pace while losing ground through weaker race pace, tyre use or racecraft. Overtaking and Defensive specialists interact with each circuit's passing difficulty; grid position matters far more at Monaco than at a high-overtaking venue. Cars also launch with stronger concept-specific strengths and weaknesses instead of being uniformly good or bad in every dimension.

## Constructors, staff and test drivers

Each F1 organization contains:

- Two race drivers with explicit Driver 1 / Driver 2 hierarchy
- Two procedural test drivers and emergency reserves
- Team principal, sporting director, technical director and strategy head
- One named race engineer assigned to each race driver
- Engine supplier, eight-dimensional car model and full finances
- Facilities rated 1–10 that decay and receive automatic investment

F2, F3, F4, Formula E and WEC teams are also permanent organizations. They have their own facilities, finances, staff rarity, leadership, race engineers and team pages. WEC assigns a race engineer to each of its three seats.

Test-driver feedback contributes to practice setup and long-term car development. Test drivers can replace an injured race driver, and strong reserve performances can create market narratives or a future race seat.

## Main brands, sponsors and finances

The constructor identity is controlled by a main brand selected primarily from real automotive manufacturers and a smaller set of major non-automotive identities. Examples include Ferrari, Audi, BMW, Lamborghini, Porsche, Toyota, Honda, Aston Martin, McLaren, Mercedes and Red Bull.

A main brand determines:

- Team name and country identity
- Core annual funding
- Prestige and expected competitiveness
- Primary and secondary livery colors
- Long-term survival strength

Funding tiers range from average to huge. A huge main brand with excellent secondary sponsors can buy elite staff and drivers. An average main brand can still create a dominant short era through a brilliant principal, strong sponsor portfolio and an early signing of an undervalued prospect.

Secondary sponsor income depends on:

```text
base sponsor value
× team-principal commercial negotiation
× constructor prestige and results
× driver commercial value
× driver/sponsor nationality links
```

A driver from India, Japan, Brazil or another market can improve access to sponsors from that country. This is a financial advantage, not an automatic sporting bonus.

Team finances show main-brand funding, secondary sponsor income, prize money, driver cost, staff cost, engine cost, development spending, cash and projected balance. Financial pressure affects recruitment and makes vulnerable entries candidates for acquisition or replacement.


### Facility economy and cash control

Facilities are not a linear money sink. The cost curve rises sharply above level 7, and the final step from roughly 9.5 to 10 can consume a large constructor's surplus. Elite facilities also decay faster, so maintaining a near-perfect organization requires recurring investment. Car development combines facility quality with technical-director ability: money alone cannot create the best package without strong engineering leadership.

The included deterministic three-season cash analysis keeps the richest team below runaway levels while producing major annual facility investments and allowing elite buildings to remain rare rather than permanent.

## Dynamic constructor world

Constructor change is conservative rather than yearly chaos.

- Ferrari and a small group of heritage institutions are protected
- Vulnerable non-protected entries may leave after several seasons
- An unused main brand can acquire the grid slot and inherit its sporting lineage
- New ownership changes name, colors, funding, livery and commercial expectations
- Engines and sponsor portfolios can change without destroying the team's historical continuity
- At most a small number of entries change in an off-season

This allows Red Bull to leave one era, Lamborghini or BMW to enter another, and an average-funded organization to become temporarily elite without turning the grid into random annual churn.

## Calendar, history and GOAT systems

- Protected classics such as Monaco, Monza, Silverstone and Spa
- Conservative rotation from an international reserve pool
- Permanent race, driver, team, livery and staff histories
- Awards for F1 and feeder champions, qualifying, wet-weather performances, overtaking, pit crews and innovation
- Driver and constructor records
- Multiple transparent GOAT rankings for F1 legacy, all-motorsport achievement, peak and longevity
- Team lineage that survives ownership and identity changes

## Core performance rule

```text
Effective performance = fixed base talent
                      × fixed career curve for the current age
                      × annual form
                      + confidence, experience and specialist-skill effects
                      + car, circuit, weather, strategy and operational context
```

Rarity never changes. Results do not simply follow rarity either: machinery, strategy, development, reliability, weather and career timing determine whether talent becomes a legendary career or a famous disappointment.

## Long-run competitive balance

The included `balance-12` test runs the lap-by-lap race engine, development, market and career systems across twelve seasons. The final tuning targets a 1990s/early-2000s style range rather than a permanent single-driver sweep:

- Roughly two to four seasons per twelve with a top winner on 6–7 victories.
- Most seasons with the leading driver on 8–10 victories.
- One to three exceptional seasons above 10 victories.
- Usually five to eight race winners and four to seven winning constructors in a season.
- The leading champion of a twelve-year era normally finishes with three to five titles rather than winning almost every year.

With the v14 lap-by-lap engine, three fixed twelve-season runs (36 seasons total) produce 6 seasons at 6–7 wins, 23 at 8–10 wins, 6 above 10 wins and one unusually open season, with 5–9 race winners per season. The most successful driver in each twelve-year run won four or five championships. `balance-12` now fails if the three-seed totals leave these ranges. These are deterministic guardrails, not hard caps: an extraordinary driver-car combination can still produce a historic season.

## Project structure

```text
src/data.js       universe generation, categories, brands, sponsors, drivers and staff
src/sim.js        sessions, races, markets, finances, history and off-season evolution
src/storage.js    IndexedDB universe slots and JSON import/export
src/main.jsx      launcher, navigation, competition pages, databases and profiles
src/styles.css    responsive F1-inspired visual system and procedural liveries
scripts/smoke.mjs deterministic multi-season integrity test
scripts/deterministic.mjs race-variety, events, transfers and flags validation
scripts/universe-v4.mjs hierarchy, facilities, staff, pages and global-time validation
scripts/universe-v5.mjs race tables, age gates, preseason reports, histories and cash-loop validation
scripts/cash-analysis.mjs deterministic three-season facility and cash summary
src/raceEngine.js lap-by-lap race engine shared by F1 and the support series
src/moments.js    interest scores for race moments
src/director.js   highlights director, driver of the day and position data
src/LiveRace.jsx  Live Race page
src/legacy.js     rivalries, head-to-head ledger and Hall of Fame
scripts/race-replay.mjs overtaking, replay consistency, showcase gate and director checks
scripts/legacy-calibration.mjs 3 × 30-season rivalry and Hall of Fame calibration
vite.config.js    localhost and GitHub repository-base configuration
.github/workflows/deploy.yml automated tests, build and Pages deployment
```

See `IMPLEMENTATION.md` for the detailed design-coverage map and current prototype boundaries.

## Universe v4 additions

- Driver 1 and Driver 2 are reassigned from current ability, team tenure, total experience, prior championships, wins, podiums and recent results. Rarity and future potential are not used by the AI.
- A proven veteran can lead a still-developing Legend; the prospect can later earn Driver 1 status after becoming the stronger established performer.
- Facilities use a visible 1–10 scale across all 62 active teams. They decay every off-season, consume investment and influence development, setup, pit work, reliability and future car quality.
- Every active team has rarity-colored leadership and one named race engineer per race seat. Staff can transfer within F1, F2, F3, F4, Formula E and WEC.
- Initial universes contain teenagers, prime-age competitors and veterans already in the final season of their generated career.
- The Teams screen covers all championships with compact cards, competition filters and sorting by points, revenue or car quality.
- Driver, team, staff and event records are full browser-history pages instead of stacked modals. Back returns to the exact previous page, including non-F1 organizations.
- The shared calendar advances the whole universe by one week, four weeks or the rest of the year. Every competition scheduled in that time window is simulated.
- Visible and simulated driver skills now use the current career multiplier and annual form. Raw 99–100 ceiling skills no longer display or perform as 100 while the driver is at a 0.81 development year.
- Flags are bundled locally for every generated driver, staff member, team country and circuit.

## Universe v5 additions

- Every competition now has a race-by-race **Current Year** table and a separate **Standings** tab.
- Driver pages use Chronicle-style Overview, Current Season, Career and Transfers tabs, including numerical Y1/Y2 career evolution rather than an unlabeled bar chart.
- Team pages use Overview, Personnel, Finance and History tabs, with a permanent annual breakdown of identity, director, engine, championship result and both drivers.
- The world simulation controls remain fixed above the navigation on mobile and desktop and switch cleanly from `+1 / +4 / Year end` to `Move to next year`.
- F1 race seats have a hard minimum age of 21 in the initial universe and every off-season market. Age-21 entrants are elite but still use an early development multiplier.
- The driver-market report displays age and supports sorting by rarity, new salary, age or recency.
- Pre-season reports compare spending for all 62 teams and list branding changes, generated drivers and retirements with a competition filter.
- F4 organizations use recognizable brand-style identities instead of generic country-team labels.
- Facility investment has a nonlinear elite cost curve and faster high-end decay. A three-season deterministic cash-analysis script verifies that surpluses are reinvested without making level 10 routine.


## Universe v6

- Paddock now has tabular Driver Market, Staff Market and Business views.
- Sponsor renewals and replacements show previous/new partner and income.
- Driver retention uses happiness plus role, salary and projected title opportunity.
- A driver can have only one market action each off-season.
- Competition, circuit and Almanac records use compact top-five categories.
- Added stronger season-dominance pressure while preserving elite-driver dynasties.

## Universe v14: live races, rivalries and the Hall of Fame

### Lap-by-lap race engine

Every Grand Prix, Sprint and support race now runs all cars together, lap by lap, with cumulative race times (`src/raceEngine.js`). Pace still comes from car fit, driver level, racecraft, tyre skill, consistency, the weather timeline, heat, degradation and the team's weekend swing, but position changes happen on track:

- A car that catches the car ahead within about one second must pass it. The chance depends on the pace difference, the circuit's overtaking trait, attacker racecraft against defender racecraft and composure, and tyre age and compound. A failed attempt costs a little time; rarely it ends in contact, which costs both cars time and can retire one of them.
- Pit stops happen on the lap they are made: tyre wear, weather crossovers (timed by strategy quality), the two-compound rule, and opportunistic stops under a Safety Car or VSC. Undercuts emerge naturally.
- A crash or a car stopped on track triggers a Safety Car or VSC on that lap. The Safety Car bunches the field and is followed by a restart. A red flag remains rare and only happens in wet conditions.
- WEC runs in six-lap stints; F2 and F3 can make wear-based stops.

Each result stores `snapshots[]` (running order, gap, interval, tyre, tyre age, stops and status per lap; every lap up to 60 laps, otherwise every lap at the start and finish and every second lap in between) and scored `moments[]` (start, overtake, failed attack, contact, pit, undercut, SC, VSC, restart, rain, DNF, fastest lap, team order, finish). Replay data is kept for the current season only. When a season is archived each event keeps its full classification plus its six best moments, so saves stay small. Results from older saves load normally and simply have no replay.

Across two seeded seasons, `race-replay` measures about 18 passes per race on tight circuits such as Monaco, Hungaroring, Zandvoort and Singapore (Monaco itself usually sees under five), and about 50 on high-overtaking circuits.

### Live Race and the showcase gate

Choose **Watch race** on an event page, or from Home or Schedule for the next Grand Prix. The "director" (`src/director.js`) scores each moment by the position at stake (the win far above a podium, P10/P11 above the midfield), title contenders, rivalries, rain, closing laps and how close the cars are. It then builds:

- **Highlights**: the start, the 10–20 best moments and the last three to five laps, about 60–90 seconds at 1×.
- **Extended**: every third lap plus the notable moments in between.
- **Result only**: straight to the flag.

The page shows a lap counter that jumps between moments (for example "Lap 12 → 19"), a flag banner, a running-order tower whose rows slide when positions change, a gap strip where cars within a second visibly clump, a battle card, a race-radio feed, play/pause, 1×/2×/4×, mode and skip-to-flag controls, and optional synthesized sound cues with a mute toggle. After the flag it shows the podium, driver of the day, a tyre-strategy chart and a position chart. It works at phone width and respects `prefers-reduced-motion`.

In **More → Races to watch** you can choose title deciders, wet-forecast races, protected classics, every F1 race, or none. The world clock stops before a chosen race. That race is not simulated until you watch or skip it, so its result cannot appear in standings, Home or Results early. Pausing never changes the outcome: the same race is produced either way.

### Rivalries

Every pair of F1 drivers has a head-to-head ledger (feeder pairs are tracked once they clash or are teammates). Each race adds clash heat: 3 for a fight for the win (both in the top two and within about a second, or a pass between them for P1), 1.5 for a podium fight and 2 for contact. A first-and-second title finish adds 4 at season end.

A rivalry ignites when the two-season heat passes the threshold, they have fought for at least one win, and each has beaten the other at least once. Teammates can also become rivals when their head-to-head is between 40% and 60%, both score well, and their personal relationship has fallen to −25 or below. Formula 1 aims for two to four live rivalries and never more than five; at the cap a new rivalry must be hotter than the coolest live one to replace it. Each feeder series carries at most one. Two seasons without a clash makes a rivalry dormant; retirement makes it historic. Ignition creates a Press Room story, and live rivalry heat raises the interest score of their moments in the Live Race director.

The Almanac's **Rivalries** tab lists live, dormant and historic rivalries; each opens a head-to-head page with the record, key races and a timeline.

Personality relationship scores, previously stored in `universe.rivalries`, now live in `universe.relationships`. Older saves are migrated when they load.

### Hall of Fame

A retired F1 driver becomes eligible one season after retiring. Induction requires both at least one title or 20 wins and a legacy score in the top 10% of all retired F1 drivers. Legacy counts titles, wins, poles, podiums, all-time records and top-three seasons; rarity is never used. At most two drivers enter each year, unsuccessful candidates stay on the ballot for up to five years, and every year produces a Hall of Fame debate story. A separate, smaller **Motorsport Legends** list honours Formula E and WEC careers. Both appear in the Almanac's **Hall of Fame** tab, and inductees carry a badge on their driver page.

`legacy-calibration` runs three seeded universes for 30 seasons each and fails if live-rivalry counts or Hall of Fame totals leave their targets. The current tuning averages 2.9–3.5 live F1 rivalries per season (never more than five, never more than one per feeder series) and produces 12–13 Hall of Fame members over 30 seasons, roughly one every 2.3–2.5 seasons. Early in a universe, when few drivers have retired, a champion with only a handful of wins can still clear the top-10% bar.
