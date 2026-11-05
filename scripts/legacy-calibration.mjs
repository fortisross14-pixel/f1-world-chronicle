import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Rivalry and Hall of Fame calibration: three seeded universes, 30 seasons
// each, run in parallel child processes. Fails if live-rivalry counts or Hall
// of Fame totals leave their targets.
const SEASONS = Number(process.env.LEGACY_SEASONS || 30);
const SEEDS = [17, 2026, 20260731];
const TARGET = { liveMin: 2, liveMax: 4, hardMax: 5, feederMax: 1, hallMin: 10, hallMax: 14, hallPerYear: 2 };
const FEEDERS = ['F2', 'F3', 'F4', 'FE', 'WEC'];

async function runSeed(seed) {
  const { createUniverse } = await import('../src/data.js');
  const { simulateToSeasonEnd, advanceToNextSeason } = await import('../src/sim.js');
  let universe = createUniverse(seed);
  const seasons = [];
  for (let season = 0; season < SEASONS; season += 1) {
    const started = Date.now();
    universe = simulateToSeasonEnd(universe);
    const year = universe.year;
    universe = advanceToNextSeason(universe);
    const live = universe.rivalries.filter((rivalry) => rivalry.status === 'live');
    seasons.push({
      year,
      liveF1: live.filter((rivalry) => rivalry.series === 'F1').length,
      liveFeeder: Object.fromEntries(FEEDERS.map((series) => [series, live.filter((rivalry) => rivalry.series === series).length])),
      teammate: live.filter((rivalry) => rivalry.type === 'teammate').length,
      inducted: universe.hallOfFame.inductees.filter((item) => item.year === year).length,
      legends: universe.hallOfFame.legends.filter((item) => item.year === year).length,
      debate: universe.stories.some((story) => story.category === 'Hall of Fame' && story.year === year),
    });
    if (process.env.LEGACY_PROGRESS) process.stderr.write(`seed ${seed} season ${season + 1}: ${((Date.now() - started) / 1000).toFixed(1)}s, drivers ${universe.drivers.length}, pairs ${Object.keys(universe.headToHead).length}, bytes ${JSON.stringify(universe).length}
`);
    // Keep the long run fast; none of these feed rivalries or the Hall of Fame.
    universe.eventArchive = [];
    universe.stories = universe.stories.slice(0, 40);
    universe.preseasonReports = universe.preseasonReports.slice(0, 2);
    universe.marketHistory = universe.marketHistory.slice(0, 80);
    universe.staffMarketHistory = (universe.staffMarketHistory || []).slice(0, 80);
  }
  const rivalries = universe.rivalries.map((rivalry) => ({ series: rivalry.series, type: rivalry.type, status: rivalry.status, ignitedYear: rivalry.ignitedYear }));
  return { seed, seasons, rivalries, hall: universe.hallOfFame.inductees.map((item) => ({ year: item.year, name: item.name, titles: item.titles, wins: item.wins })), legends: universe.hallOfFame.legends.length, ledgerPairs: Object.keys(universe.headToHead).length };
}

if (process.argv[2] === '--seed') {
  const result = await runSeed(Number(process.argv[3]));
  process.stdout.write(JSON.stringify(result));
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

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const rows = results.map((result) => {
  const settled = result.seasons.slice(3); // rivalries need a couple of seasons to build
  const hallTotal = result.hall.length;
  return {
    seed: result.seed,
    'live F1 (mean)': Number(mean(settled.map((season) => season.liveF1)).toFixed(2)),
    'live F1 (min–max)': `${Math.min(...settled.map((season) => season.liveF1))}–${Math.max(...result.seasons.map((season) => season.liveF1))}`,
    'feeder max': Math.max(...result.seasons.flatMap((season) => Object.values(season.liveFeeder))),
    'F1 ignitions': result.rivalries.filter((rivalry) => rivalry.series === 'F1').length,
    'F1 teammate': result.rivalries.filter((rivalry) => rivalry.series === 'F1' && rivalry.type === 'teammate').length,
    'teammate rivalries': result.rivalries.filter((rivalry) => rivalry.type === 'teammate').length,
    'rivalries ever': result.rivalries.length,
    'Hall of Fame': hallTotal,
    'max per year': Math.max(...result.seasons.map((season) => season.inducted)),
    'seasons per inductee': hallTotal ? Number((SEASONS / hallTotal).toFixed(1)) : '—',
    legends: result.legends,
    'ledger pairs': result.ledgerPairs,
  };
});
console.table(rows);
for (const result of results) console.log(`Seed ${result.seed} Hall of Fame:`, result.hall.map((item) => `Y${item.year} ${item.name} (${item.titles}T/${item.wins}W)`).join(', ') || 'none');

for (const [index, result] of results.entries()) {
  const row = rows[index];
  for (const season of result.seasons) {
    assert.ok(season.liveF1 <= TARGET.hardMax, `Seed ${result.seed} year ${season.year}: ${season.liveF1} live F1 rivalries exceeds the hard max`);
    for (const [series, count] of Object.entries(season.liveFeeder)) assert.ok(count <= TARGET.feederMax, `Seed ${result.seed} year ${season.year}: ${count} live ${series} rivalries`);
    assert.ok(season.inducted <= TARGET.hallPerYear, `Seed ${result.seed} year ${season.year}: more than ${TARGET.hallPerYear} inductees`);
    assert.ok(season.debate, `Seed ${result.seed} year ${season.year}: missing the Hall of Fame debate story`);
  }
  assert.ok(row['live F1 (mean)'] >= TARGET.liveMin && row['live F1 (mean)'] <= TARGET.liveMax, `Seed ${result.seed}: mean live F1 rivalries ${row['live F1 (mean)']} outside ${TARGET.liveMin}–${TARGET.liveMax}`);
  assert.ok(row['Hall of Fame'] >= TARGET.hallMin && row['Hall of Fame'] <= TARGET.hallMax, `Seed ${result.seed}: ${row['Hall of Fame']} Hall of Fame inductees after ${SEASONS} seasons, target ${TARGET.hallMin}–${TARGET.hallMax}`);
}
console.log('Legacy calibration passed.');
