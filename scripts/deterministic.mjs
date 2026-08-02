import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { createUniverse, countryIso2, getTeam } from '../src/data.js';
import { advanceToNextSeason, driverStandings, simulateToSeasonEnd } from '../src/sim.js';

const expectedEvents = { F1: 24, F2: 14, F3: 12, F4: 10, FE: 12, WEC: 8 };
const requiredSessions = ['FP1', 'Q1', 'Q2', 'Q3', 'R'];
const summaries = [];

for (const seed of [17, 2026, 20260731]) {
  let universe = createUniverse(seed);
  assert.equal(universe.drivers.filter((driver) => driver.active && driver.rarity === 'Generational').length, 1, 'A new universe should launch with one global Generational driver');

  // Every initial driver and venue must resolve to a bundled local flag.
  const countries = new Set([
    ...universe.drivers.map((driver) => driver.countryCode || driver.country),
    ...universe.circuitPool.map((event) => event.country),
  ]);
  for (const country of countries) {
    const iso = countryIso2(country).toLowerCase();
    await access(new URL(`../public/flags/${iso}.png`, import.meta.url));
  }

  universe = simulateToSeasonEnd(universe);
  assert.equal(universe.phase, 'Season complete');

  for (const [series, count] of Object.entries(expectedEvents)) {
    const events = universe.competitionEventResults[series];
    assert.equal(events.length, count, `${series} should complete its entire calendar`);
    for (const event of events) {
      for (const session of requiredSessions) {
        assert.ok(event.sessions[session], `${series} ${event.eventId} is missing ${session}`);
        assert.ok(event.sessions[session].rows.length > 0, `${series} ${event.eventId} ${session} is empty`);
      }
      for (const session of Object.values(event.sessions)) {
        assert.ok(session.rows.length > 0, `${series} ${event.eventId} ${session.key} is empty`);
      }
      assert.equal(event.podium.length, 3);
      assert.ok(event.fastestLapTime > 0);
    }
  }

  const f1 = driverStandings(universe, 'F1');
  const raceCount = universe.competitionEventResults.F1.length;
  const winners = f1.filter((driver) => driver.season.wins > 0);
  const maximumWins = Math.max(...f1.map((driver) => driver.season.wins));
  assert.ok(winners.length >= 3, 'A season should produce at least three F1 winners');
  assert.ok(maximumWins < raceCount, 'No driver may sweep every race');

  universe = advanceToNextSeason(universe);
  assert.ok(universe.marketHistory.length > 0, 'The off-season should create a visible transfer ledger');
  assert.ok(universe.marketHistory.every((move) => move.from && move.to && Number.isFinite(move.to.salary)), 'Every market move needs origin, destination and salary');

  for (const [series, teams] of Object.entries(universe.feederTeams)) {
    const capacity = series === 'WEC' ? 3 : 2;
    for (const team of teams) {
      const seats = universe.drivers
        .filter((driver) => driver.active && driver.series === series && driver.role === 'Race driver' && driver.teamId === team.id)
        .map((driver) => driver.seat)
        .sort((a, b) => a - b);
      assert.deepEqual(seats, Array.from({ length: capacity }, (_, index) => index + 1), `${team.name} must preserve its ${series} seat hierarchy`);
    }
  }

  for (const team of universe.teams) {
    const raceDrivers = universe.drivers
      .filter((driver) => driver.active && driver.series === 'F1' && driver.role === 'Race driver' && driver.teamId === team.id)
      .sort((a, b) => a.seat - b.seat);
    const testDrivers = (team.testDriverIds || [])
      .map((id) => universe.drivers.find((driver) => driver.id === id))
      .filter((driver) => driver?.active && driver.role === 'Test driver');
    assert.deepEqual(raceDrivers.map((driver) => driver.seat), [1, 2], `${team.name} must have first and second drivers`);
    assert.equal(testDrivers.length, 2, `${team.name} must have two test drivers`);
    assert.ok(testDrivers.every((driver) => driver.seat === 3), `${team.name} test drivers should display as seat 3`);
    assert.ok(Number.isFinite(team.finances.totalIncome) && team.finances.totalIncome > 0);
    assert.ok(Number.isFinite(team.finances.totalExpenses) && team.finances.totalExpenses > 0);
    assert.ok(Number.isFinite(team.finances.projectedBalance));
  }

  assert.ok(universe.teams.some((team) => team.finances.projectedBalance > 60), 'At least one well-run team should create meaningful surplus');
  assert.ok(universe.teams.every((team) => getTeam(universe, team.id)), 'Every constructor must remain navigable');

  summaries.push({ seed, winners: winners.length, maximumWins, marketMoves: universe.marketHistory.length });
}

console.log('Deterministic universe validation passed:', summaries);
