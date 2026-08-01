import assert from 'node:assert/strict';
import { createUniverse, currentDriverRating, getTeam, SCHEMA_VERSION } from '../src/data.js';
import { advanceToNextSeason, simulateToSeasonEnd } from '../src/sim.js';

const SERIES = ['F1', 'F2', 'F3', 'F4', 'FE', 'WEC'];
const ELITE = new Set(['Generational', 'Legend']);

let universe = createUniverse(20260731);
assert.equal(universe.schemaVersion, SCHEMA_VERSION);

// F1 should not begin with teenage or 20-year-old race drivers. A 21-year-old
// must be an exceptional prospect who is still performing well below his ceiling.
let f1Grid = universe.drivers.filter((driver) => driver.active && driver.series === 'F1' && driver.role === 'Race driver');
assert.equal(f1Grid.length, 22);
assert.ok(f1Grid.every((driver) => driver.age >= 21), 'Initial F1 grid cannot contain drivers under 21');
for (const driver of f1Grid.filter((item) => item.age === 21)) {
  assert.ok(ELITE.has(driver.rarity), `${driver.name}: only elite rarity may reach F1 at 21`);
  assert.equal(driver.seat, 2, `${driver.name}: a 21-year-old newcomer should begin as Driver 2`);
  assert.ok(driver.careerMultiplier <= 0.88, `${driver.name}: first F1 season must remain on an early career multiplier`);
  assert.ok(currentDriverRating(driver) < 90, `${driver.name}: teams should see current ability, not hidden ceiling`);
}

universe = simulateToSeasonEnd(universe);
assert.equal(universe.phase, 'Season complete');

// Every championship must expose a complete race-by-race current-year archive.
for (const series of SERIES) {
  const calendar = universe.competitionCalendars[series];
  const results = universe.competitionEventResults[series];
  assert.equal(results.length, calendar.length, `${series} must complete every scheduled event`);
  for (const record of results) {
    assert.equal(record.podium.length, 3, `${series} ${record.event?.name}: podium must contain three drivers`);
    assert.ok(record.winnerId, `${series} ${record.event?.name}: winner is required`);
    assert.ok(record.teamWinnerId, `${series} ${record.event?.name}: winning team is required`);
    assert.ok(record.poleId, `${series} ${record.event?.name}: pole sitter is required`);
    assert.ok(record.fastestLapDriverId, `${series} ${record.event?.name}: fastest-lap driver is required`);
    assert.ok(Number.isFinite(record.fastestLapTime), `${series} ${record.event?.name}: fastest-lap time is required`);
  }
}

universe = advanceToNextSeason(universe);
assert.equal(universe.phase, 'Pre-season');

// The market must continue respecting the F1 age floor.
f1Grid = universe.drivers.filter((driver) => driver.active && driver.series === 'F1' && driver.role === 'Race driver');
assert.equal(f1Grid.length, 22);
assert.ok(f1Grid.every((driver) => driver.age >= 21), 'Post-market F1 grid cannot contain drivers under 21');
for (const driver of f1Grid.filter((item) => item.age === 21)) {
  assert.ok(ELITE.has(driver.rarity), `${driver.name}: post-market age-21 F1 driver must be elite`);
  assert.ok(currentDriverRating(driver) < 90, `${driver.name}: post-market age-21 F1 driver must still be developing`);
}

// Pre-season magazine and team histories must contain the requested universe changes.
const report = universe.preseasonReports[0];
assert.ok(report, 'A pre-season report must be generated');
const allTeams = [...universe.teams, ...Object.values(universe.feederTeams).flat()];
assert.equal(report.spendingChanges.length, allTeams.length, 'Every active team needs a spending comparison');
assert.ok(Array.isArray(report.brandingChanges));
assert.ok(report.spawned.length > 0, 'The report should list new procedural drivers');
assert.ok(report.retired.length > 0, 'The report should list retiring drivers');

for (const team of allTeams) {
  const season = team.career?.seasons?.at(-1);
  assert.ok(season, `${team.name}: annual history row is required`);
  assert.ok(Number.isInteger(season.position) && season.position >= 1, `${team.name}: constructor/team position is required`);
  assert.ok(Number.isFinite(season.points), `${team.name}: annual points are required`);
  assert.ok(season.teamPrincipalName, `${team.name}: team director is required`);
  assert.ok(season.engineName, `${team.name}: engine is required`);
  assert.ok(Array.isArray(season.pilots) && season.pilots.length >= 2, `${team.name}: annual driver breakdown is required`);
  for (const pilot of season.pilots) {
    assert.ok(Number.isFinite(pilot.points), `${team.name}: pilot points are required`);
    assert.ok(Number.isInteger(pilot.position) && pilot.position >= 1, `${team.name}: pilot position is required`);
  }
}

// Expensive, faster-decaying elite facilities should absorb surpluses instead of
// allowing every organization to accumulate limitless cash and perfect buildings.
const cash = allTeams.map((team) => team.finances?.cash || 0);
const investments = allTeams.map((team) => team.finances?.facilityInvestment || 0);
assert.ok(Math.max(...cash) < 900, 'One off-season should not create runaway cash hoarding');
assert.ok(Math.max(...investments) >= 100, 'At least one team should make a major facility investment');
assert.ok(allTeams.some((team) => Object.values(team.facilities || {}).some((value) => value >= 9)), 'Elite facilities should exist');
assert.ok(allTeams.every((team) => !Object.values(team.facilities || {}).every((value) => value >= 9.99)), 'No team should trivially maintain perfect facilities');

// F4 identities should be brands rather than generic country placeholders.
const forbiddenGeneric = /^(Spanish|British|French|German|Italian|Japanese|Brazilian|Indian|American|Nordic|Benelux) F4 Team$/i;
assert.ok(universe.feederTeams.F4.every((team) => !forbiddenGeneric.test(team.name)), 'F4 teams need branded universe identities');
assert.ok(universe.feederTeams.F4.every((team) => getTeam(universe, team.id)?.id === team.id), 'Every F4 team page must resolve');

console.log('Universe v5 validation passed:', {
  schema: SCHEMA_VERSION,
  raceRows: Object.fromEntries(SERIES.map((series) => [series, universe.eventArchive.filter((record) => record.series === series).length])),
  preseasonChanges: report.spendingChanges.length,
  spawned: report.spawned.length,
  retired: report.retired.length,
  maxCash: Math.max(...cash),
  maxFacilityInvestment: Math.max(...investments),
});
