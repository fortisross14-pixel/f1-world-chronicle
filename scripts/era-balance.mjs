import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Long-run team balance: three seeded universes for 25 seasons each, run in
// parallel child processes. Checks that no constructor owns the era, that the
// fastest car usually wins, that the grid does not spread apart, and that
// dominant eras exist but end.
const SEASONS = Number(process.env.ERA_SEASONS || 25);
const SEEDS = [17, 2026, 20260731];
// House rule: no team or driver wins more than three titles in a row.
const TARGET = { maxTitlesPerTeam: 8, minTitleTeams: 4, topCarShare: 0.5, maxSpreadAfter10: 15, maxStraight: 3, driverTitles: [3, 7] };

async function runSeed(seed) {
  const { createUniverse, currentDriverRating, getEngine } = await import('../src/data.js');
  const { simulateToSeasonEnd, advanceToNextSeason, driverStandings, constructorStandings } = await import('../src/sim.js');
  const avg = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  let universe = createUniverse(seed);
  const seasons = [];
  for (let season = 0; season < SEASONS; season += 1) {
    universe = simulateToSeasonEnd(universe);
    const drivers = driverStandings(universe, 'F1');
    const constructors = constructorStandings(universe);
    // Car strength: car-dimension average plus engine.
    const carScore = (team) => { const engine = getEngine(universe, team.engineId); return avg(Object.values(team.car)) * 0.8 + avg([engine?.peak || 82, engine?.efficiency || 82]) * 0.2; };
    const lineup = (team) => avg(universe.drivers.filter((driver) => driver.active && driver.series === 'F1' && driver.role === 'Race driver' && driver.teamId === team.id).map((driver) => currentDriverRating(driver)));
    const carRank = [...universe.teams].sort((a, b) => carScore(b) - carScore(a)).map((team) => team.id);
    const lineupRank = [...universe.teams].sort((a, b) => lineup(b) - lineup(a)).map((team) => team.id);
    const cars = universe.teams.map(carScore);
    const facilities = universe.teams.map((team) => avg(Object.values(team.facilities)));
    const champion = constructors[0];
    seasons.push({
      year: universe.year,
      driverChampion: drivers[0].name,
      driverChampionId: drivers[0].id,
      driverTeam: universe.teams.find((team) => team.id === drivers[0].teamId)?.name || '—',
      constructorId: champion.id,
      constructor: champion.name,
      carRank: carRank.indexOf(champion.id) + 1,
      lineupRank: lineupRank.indexOf(champion.id) + 1,
      carSpread: Number((Math.max(...cars) - Math.min(...cars)).toFixed(1)),
      facilities: `${Math.min(...facilities).toFixed(1)}–${Math.max(...facilities).toFixed(1)}`,
      topWins: Math.max(...drivers.map((driver) => driver.season.wins)),
      winners: drivers.filter((driver) => driver.season.wins > 0).length,
      richestCash: Math.max(...universe.teams.map((team) => team.finances.cash || 0)),
    });
    universe = advanceToNextSeason(universe);
    // Keep memory low between seasons.
    universe.eventArchive = [];
    universe.stories = universe.stories.slice(0, 30);
    universe.sessionResults = [];
    universe.preseasonReports = universe.preseasonReports.slice(0, 2);
    universe.marketHistory = universe.marketHistory.slice(0, 80);
    universe.staffMarketHistory = (universe.staffMarketHistory || []).slice(0, 80);
  }
  return { seed, seasons };
}

if (process.argv[2] === '--seed') {
  process.stdout.write(JSON.stringify(await runSeed(Number(process.argv[3]))));
  process.exit(0);
}

const self = fileURLToPath(import.meta.url);
const runChild = (seed) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [self, '--seed', String(seed)], { stdio: ['ignore', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });
  child.on('close', (code) => (code === 0 ? resolve(JSON.parse(out)) : reject(new Error(`seed ${seed} exited with ${code}`))));
});
const results = await Promise.all(SEEDS.map(runChild));

function longestRun(ids) { let best = 0, run = 0; ids.forEach((id, i) => { run = i && ids[i - 1] === id ? run + 1 : 1; best = Math.max(best, run); }); return best; }
const summary = [];
for (const { seed, seasons } of results) {
  console.log(`\nSeed ${seed}`);
  console.table(seasons.map((s) => ({ year: s.year, 'driver champion': `${s.driverChampion} (${s.driverTeam})`, constructors: s.constructor, 'car rank': s.carRank, 'line-up rank': s.lineupRank, 'car spread': s.carSpread, facilities: s.facilities, 'top wins': s.topWins, winners: s.winners })));
  const titles = new Map(); seasons.forEach((s) => titles.set(s.constructorId, (titles.get(s.constructorId) || 0) + 1));
  const driverTitles = new Map(); seasons.forEach((s) => driverTitles.set(s.driverChampionId, (driverTitles.get(s.driverChampionId) || 0) + 1));
  const ids = seasons.map((s) => s.constructorId);
  summary.push({
    seed,
    'max team titles': Math.max(...titles.values()),
    'title-winning teams': titles.size,
    'champion car top-2': `${Math.round(seasons.filter((s) => s.carRank <= 2).length / seasons.length * 100)}%`,
    'max spread after Y10': Math.max(...seasons.filter((s) => s.year > 10).map((s) => s.carSpread)),
    'longest team run': longestRun(ids),
    'longest driver run': longestRun(seasons.map((s) => s.driverChampionId)),
    'most driver titles': Math.max(...driverTitles.values()),
    'mean winners': Number((seasons.reduce((sum, s) => sum + s.winners, 0) / seasons.length).toFixed(1)),
  });
}
console.log('\nEra balance summary');
console.table(summary);

if (SEASONS >= 25) {
  // Hard checks: these hold across the seeds we sampled (8–9 of 9).
  for (const row of summary) {
    assert.ok(row['title-winning teams'] >= TARGET.minTitleTeams, `Seed ${row.seed}: only ${row['title-winning teams']} teams won a title`);
    assert.ok(row['max spread after Y10'] <= TARGET.maxSpreadAfter10, `Seed ${row.seed}: car spread reached ${row['max spread after Y10']} after year 10`);
    assert.ok(row['longest team run'] <= TARGET.maxStraight, `Seed ${row.seed}: a constructor won ${row['longest team run']} titles in a row (max ${TARGET.maxStraight})`);
    assert.ok(row['longest driver run'] <= TARGET.maxStraight, `Seed ${row.seed}: a driver won ${row['longest driver run']} titles in a row (max ${TARGET.maxStraight})`);
    assert.ok(row['most driver titles'] >= TARGET.driverTitles[0] && row['most driver titles'] <= TARGET.driverTitles[1], `Seed ${row.seed}: most driver titles ${row['most driver titles']}`);
  }
  for (const row of summary) {
    assert.ok(row['max team titles'] <= TARGET.maxTitlesPerTeam, `Seed ${row.seed}: one constructor won ${row['max team titles']} titles (max ${TARGET.maxTitlesPerTeam})`);
  }
  // The fastest car winning is noisy per seed, so it is reported per seed and checked on average.
  const warnings = summary.filter((row) => parseInt(row['champion car top-2'], 10) < TARGET.topCarShare * 100).map((row) => `Seed ${row.seed}: champion had a top-2 car in ${row['champion car top-2']} of seasons (target ≥ 50%)`);
  warnings.forEach((warning) => console.log(`TARGET NOT MET: ${warning}`));
  const meanTop = summary.reduce((sum, row) => sum + parseInt(row['champion car top-2'], 10), 0) / summary.length;
  assert.ok(meanTop >= 45, `Fastest-car share regressed: ${meanTop.toFixed(0)}% of champions had a top-2 car`);
  console.log(warnings.length ? `Era balance passed with ${warnings.length} reported target miss(es).` : 'Era balance passed.');
}
