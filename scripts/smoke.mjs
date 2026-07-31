import assert from 'node:assert/strict';
import { createUniverse, SCHEMA_VERSION } from '../src/data.js';
import { advanceToNextSeason, constructorStandings, driverStandings, simulateToSeasonEnd } from '../src/sim.js';

let universe = createUniverse(20260731);

assert.equal(universe.schemaVersion, SCHEMA_VERSION);
assert.equal(universe.teams.length, 11);
assert.equal(universe.drivers.filter((driver) => driver.active && driver.series === 'F1' && driver.role === 'Race driver').length, 22);

for (let season = 0; season < 3; season += 1) {
  universe = simulateToSeasonEnd(universe);
  assert.equal(universe.phase, 'Season complete');
  assert.equal(universe.raceResults.length, universe.calendar.length);
  assert.ok(driverStandings(universe, 'F1')[0].season.points > 0);
  assert.ok(constructorStandings(universe)[0].seasonPoints > 0);
  assert.ok(universe.awards.some((award) => award.year === universe.year && award.type === 'World Champion'));

  universe = advanceToNextSeason(universe);
  assert.equal(universe.phase, 'Pre-season');
  assert.equal(universe.seasonArchive.length, season + 1);
  assert.ok(universe.seasonArchive.at(-1).series.F4.championId);

  const expected = { F1: 22, F2: 20, F3: 20, F4: 24, FE: 22, WEC: 24 };
  for (const [series, count] of Object.entries(expected)) {
    const active = universe.drivers.filter((driver) => driver.active && driver.series === series && driver.role === 'Race driver').length;
    assert.equal(active, count, `${series} grid should remain full`);
  }
}

console.log(`F1 World Chronicle schema v${SCHEMA_VERSION}: 3-season smoke test passed.`);
