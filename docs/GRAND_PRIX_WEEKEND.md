# Grand Prix weekend

A guided view of one F1 weekend: **Pre-race → Qualifying → (Sprint) → Race → Post-race**.
It is navigation and visualisation only. It does not change the simulation, points or balance.
Code: `src/GrandPrixWeekend.jsx`, wired up in `App()` in `src/main.jsx`.

## Entry points

- **Next GP · <country>** in the global sim bar, in the Home/Schedule watch card and in the Schedule header.
- **Watch** on a pending showcase race, and **Watch race** on the next GP's event page.
- **Watch weekend** on a completed current-season F1 event page (replay, nothing pending).
- **Next GP ›** on Post-race.

Opening a live weekend calls `simulateThroughF1Event(universe, eventId)`, which runs every series up to and
including the next F1 race into a *pending* universe. The committed universe is kept as `before`.

## Steps and the data they read

| Step | Reads | Notes |
|---|---|---|
| Pre-race | `before` (committed universe) | Hero (round X of Y, flag, `raceForecast` rain chance and temperature, showcase reason), win odds, last year here, top 3 drivers/teams with gap, title-decider tag (`isTitleDecider`) |
| Qualifying | race record `sessions.Q1/Q2/Q3/QUALI` | Q1/Q2/Q3 tabs; rows reveal slowest-first over ~2.5s ("Show all" skips; instant with reduced motion). Cut line, greyed eliminations with reason. Starting grid card after Q3 |
| Sprint (sprint weekends only) | `sessions.SQUALI`, `sessions.S` | Sprint qualifying and sprint tables; "Watch sprint" uses LiveRace only if the sprint has replay data |
| Race | `sessions.R` + pending universe | Embedded `LiveRace` (modes, speeds, skip). Default mode **Highlights** shows only top-3 fights. On finish it moves to Post-race after ~2s |
| Post-race | committed universe after the race | Winner, podium, fastest lap, driver of the day, top 5 drivers/teams with points gained and ▲/▼ moves (diff against `before`), up to 3 new stories from this round |

## Spoiler rules

- Pre-race, Qualifying and Race never show the winner, updated standings or stories about this race.
- Pre-race reads only `before`. The forecast shows the rain *chance*, never the drawn race weather state.
- The pending universe is committed only when Post-race is reached or **Skip to result** is pressed.
- Leaving the weekend mid-way drops the pending universe (same as the old Live Race page). The world
  stays where it was; reopening re-simulates the same deterministic result.
- A replay ("Watch weekend") has nothing pending. Pre-race shows what the record allows (no odds or standings),
  Post-race labels standings as *current* and shows points scored at this event.

## Win odds

For every F1 race driver in `before`:

```
strength = 1.6·z(car fit) + 0.9·z(driver rating) + 0.6·z(−avg last-5 finish) + 0.4·z(−championship position)
p_i      = exp(1.4·strength_i) / Σ exp(1.4·strength_j)
odds_i   = 1 / p_i   (decimal, no bookmaker margin)
```

- car fit: `circuitFitRanking(before, event).fitScore` for the driver's team
- driver rating: `currentDriverRating(driver)`
- form: mean of `season.form` (last 5 finishes; 11 if none)
- `z()` is a z-score across the field. Qualifying and the race result are never used.

The top 8 are shown with a bar scaled to the favourite.

## Links

Driver, team and championship names in Pre-race, Qualifying, Sprint and Post-race open their pages (`src/Links.jsx`).
Linked pages show the committed world, so a pending result never leaks. Back returns to the same step and scroll position
(Qualifying also keeps its tab), and the race stays pending. A pending weekend is only resumed while the world has not moved
on since it was opened. If you sim time elsewhere, the weekend is dropped and Next GP starts fresh.

## Routes

`#/weekend/<eventId>/<step>` with step `pre | quali | sprint | race | post`.
Each step is a history entry, so browser Back/Forward move between steps. The sticky breadcrumb also holds **Next ›** and **Skip**, so you never need to scroll to the bottom. Steps are tappable once reached
(all steps after the result is committed or in a replay).
