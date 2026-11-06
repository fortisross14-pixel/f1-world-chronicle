# Post-season review

A guided review between seasons: **Season summary › Retirements & rookies › Market › Pre-season**.
It is navigation and visualisation only. It does not change the off-season logic.
Code: `src/PostSeason.jsx`, wired up in `App()` in `src/main.jsx`. Styles reuse the Grand Prix weekend `gpw-*` classes plus `ps-*`.

## Flow

- Opens automatically when **Year end** (or the last event) finishes the season. It does not open on load or in the
  middle of a Grand Prix weekend. In those cases the sim bar's **Season review** button (formerly "Move to Year X") opens it.
- On open: `before` = the completed-season universe, `pending = advanceToNextSeason(before)`.
- `pending` is committed only by **Start Year X** (goes Home), **Next GP ›** (commits, then opens the Year X round 1
  weekend) or **Skip review** (same as Start).
- Leaving mid-flow keeps the season complete. Nothing is saved. Reopening reuses or recomputes `pending`
  (deterministic).
- Sticky breadcrumb: steps are tappable once reached. It also holds **Next ›** and **Skip review**. Each step repeats **Next ›** at the bottom.

## Steps and the universe they read

| Step | Reads | Content |
|---|---|---|
| Season summary | `before` (awards and title count from `pending`, because `finalizeSeasonAwards` runs inside `advanceToNextSeason`) | F1 champion (team, points, margin, titles), constructors' champion, season leaders, F1 awards, champions of F2/F3/F4/FE/WEC |
| Retirements & rookies | `pending` (+ `before` for a retiree's last team) | Hall of Fame class, top 5 retirements + "N more", top 5 new prospects and class summary |
| Market | `pending` | Driver transfers, staff moves, X driver / Y staff move count, collapsible branding and sponsor changes |
| Pre-season | `pending` | F1 top 3 drivers and teams by pre-season form, favourite driver and team per support series, round 1 |

## Selection rules

- **Season leaders**: from F1 driver `season` stats (wins, poles, podiums, dnfs, positionsGained, qualifyingPoints).
  Points finishes are counted from this season's race rows. Fastest laps come from `records.fastestLaps` for the year.
- **Hall of Fame**: every `hallOfFame.inductees` entry with `year` = the completed year, including earlier retirees voted in from the ballot.
- **Retirements**: `preseasonReports[0].retired`, sorted by HoF inductee first, then F1 titles, F1 wins, then rarity. Top 5 are shown.
- **Prospects**: `preseasonReports[0].spawned`, sorted by rarity then `currentDriverRating`. Top 5 are shown. The class summary
  shows the count, the average current rating and a rarity breakdown.
- **Driver moves**: `marketHistory` for the new year, folded to one entry per driver (first `from` and last `to`).
  Renewals are dropped (same team, series and role).
- **Market lists** (drivers and staff): every Generational and Legend mover, filled up to 10 with the highest rated
  (`currentDriverRating` for drivers, staff `rating` for staff), then sorted by rarity and rating.
- **Pre-season form**: `powerRankings(pending,'drivers'|'teams')`, which uses ability and car strength, not last year's points.
  Support series: the highest `currentDriverRating` race driver and the team with the best rating.

## Links

Driver, team, staff and championship names open their pages. Back returns to the same step. Linked pages show the
completed-season world (the off-season is not committed yet), so a driver who just moved still shows last year's team there.
New prospects only exist in the pending world, so their names are plain text.

## Routes

`#/postseason/<year>/<step>` with step `summary | people | market | preseason`. Each step is a history entry,
so browser Back/Forward move between steps.

Not built (optional): a read-only review of past seasons from Almanac → Seasons.
