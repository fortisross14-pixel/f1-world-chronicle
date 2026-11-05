import assert from 'node:assert/strict';
import { createUniverse, hydrateUniverse } from '../src/data.js';
import { simulateToSeasonEnd, advanceToNextSeason, hasReplay } from '../src/sim.js';

// Lap-by-lap race engine validation: realistic overtaking, circuit character,
// replay snapshots that agree with the classification, and small saves.
const MOMENT_TYPES = new Set(['start','overtake','failedAttack','contact','pit','undercut','sc','vsc','restart','rain','dnf','fastestLap','teamOrder','finish']);
const FLAGS = new Set(['green','sc','vsc','red']);

function checkReplay(label, race, laps) {
  const rows = race.rows;
  const ids = rows.map((row) => row.driverId);
  const idSet = new Set(ids);
  assert.ok(race.snapshots?.length > 1, `${label}: missing snapshots`);
  let lastLap = -1;
  const outSince = new Map();
  for (const snap of race.snapshots) {
    assert.ok(snap.lap > lastLap, `${label}: snapshot laps must increase`);
    lastLap = snap.lap;
    assert.ok(FLAGS.has(snap.flag), `${label}: bad flag ${snap.flag}`);
    assert.equal(snap.order.length, ids.length, `${label} lap ${snap.lap}: every car must appear once`);
    assert.equal(new Set(snap.order.map((entry) => entry.driverId)).size, ids.length, `${label} lap ${snap.lap}: duplicate car`);
    let seenOut = false;
    let previousGap = -Infinity;
    for (const entry of snap.order) {
      assert.ok(idSet.has(entry.driverId), `${label}: unknown driver in snapshot`);
      assert.ok(['run', 'pit', 'out'].includes(entry.status), `${label}: bad status`);
      assert.ok('SMHIW'.includes(entry.tyre) && entry.tyre.length === 1, `${label}: bad tyre code`);
      if (entry.status === 'out') { seenOut = true; if (!outSince.has(entry.driverId)) outSince.set(entry.driverId, snap.lap); continue; }
      assert.ok(!seenOut, `${label} lap ${snap.lap}: retired cars must be listed after running cars`);
      assert.ok(!outSince.has(entry.driverId), `${label}: a retired car cannot return`);
      assert.ok(entry.gap >= previousGap - 1e-9, `${label} lap ${snap.lap}: gaps must not decrease down the order`);
      previousGap = entry.gap;
    }
  }
  const final = race.snapshots.at(-1);
  assert.equal(final.lap, laps, `${label}: final snapshot must be the last lap`);
  assert.deepEqual(final.order.map((entry) => entry.driverId), ids, `${label}: final snapshot must match the classification`);
  for (const row of rows) {
    const entry = final.order.find((item) => item.driverId === row.driverId);
    assert.equal(entry.status === 'out', row.status !== 'Running', `${label}: ${row.driverId} status must agree with the classification`);
    assert.equal(entry.pits, row.pitStops, `${label}: pit count must agree`);
  }
  for (const moment of race.moments) {
    assert.ok(MOMENT_TYPES.has(moment.type), `${label}: bad moment type ${moment.type}`);
    assert.ok(moment.lap >= 0 && moment.lap <= laps, `${label}: moment lap out of range`);
    assert.ok(Number.isFinite(moment.score), `${label}: moment needs an interest score`);
    assert.ok(typeof moment.text === 'string' && moment.text.length > 0, `${label}: moment needs text`);
    for (const id of moment.driverIds || []) assert.ok(idSet.has(id), `${label}: moment references unknown driver`);
  }
  assert.ok(race.moments.some((moment) => moment.type === 'start'), `${label}: needs a start moment`);
  assert.ok(race.moments.some((moment) => moment.type === 'finish'), `${label}: needs a finish moment`);
}

const summary = [];
const lowTracks = [];
const highTracks = [];
const midTracks = [];
for (const seed of [17, 2026]) {
  let universe = simulateToSeasonEnd(createUniverse(seed));
  assert.equal(universe.phase, 'Season complete');
  for (const record of universe.competitionEventResults.F1) {
    const race = record.sessions.R;
    checkReplay(`F1 ${seed} ${record.eventId}`, race, race.laps);
    const sprint = record.sessions.S;
    if (sprint?.snapshots) checkReplay(`F1 sprint ${seed} ${record.eventId}`, sprint, sprint.laps);
    const overtake = record.event.traits.overtake;
    assert.ok(race.overtakes <= 130, `${record.eventId}: ${race.overtakes} overtakes is unrealistic`);
    if (overtake < 40) lowTracks.push(race.overtakes);
    else if (overtake >= 75) highTracks.push(race.overtakes);
    else midTracks.push(race.overtakes);
  }
  for (const series of ['F2', 'F3', 'F4', 'FE', 'WEC']) {
    for (const record of universe.competitionEventResults[series]) {
      const race = record.sessions.R;
      const finalLap = race.snapshots.at(-1).lap;
      checkReplay(`${series} ${seed} ${record.eventId}`, race, finalLap);
    }
  }
  const replayBytes = JSON.stringify(universe.competitionEventResults.F1.map((record) => [record.sessions.R.snapshots, record.sessions.R.moments, record.sessions.S?.snapshots, record.sessions.S?.moments])).length;
  assert.ok(replayBytes < 4_500_000, `F1 replay data for one season is too large: ${replayBytes} bytes`);

  // Determinism: the same seed must produce identical replays.
  if (seed === 17) {
    const again = simulateToSeasonEnd(createUniverse(seed));
    assert.deepEqual(again.competitionEventResults.F1.map((record) => record.sessions.R.snapshots), universe.competitionEventResults.F1.map((record) => record.sessions.R.snapshots), 'Seeded replays must be deterministic');
  }

  // Replay data is current-season only: archived events keep results and key moments.
  universe = advanceToNextSeason(universe);
  const archived = universe.eventArchive.filter((record) => record.series === 'F1');
  assert.ok(archived.length > 0);
  assert.ok(archived.every((record) => !record.sessions.R.snapshots && record.sessions.R.rows.length > 0), 'Archive must drop snapshots but keep the classification');
  assert.ok(archived.every((record) => Array.isArray(record.sessions.R.keyMoments)), 'Archive keeps key moments');
  summary.push({ seed, replayKB: Math.round(replayBytes / 1024) });
}

// Old saves (no snapshots) still load and simply have no replay.
const legacy = simulateToSeasonEnd(createUniverse(99));
legacy.schemaVersion = 13;
for (const result of legacy.raceResults) { delete result.data.snapshots; delete result.data.moments; }
for (const record of legacy.competitionEventResults.F1) { delete record.sessions.R.snapshots; delete record.sessions.R.moments; }
const hydrated = hydrateUniverse(legacy);
assert.ok(hydrated.raceResults.length > 0);
assert.ok(hydrated.raceResults.every((result) => !hasReplay(result.data) && result.data.rows.length > 0), 'Legacy results load without replay');
assert.ok(hasReplay(simulateToSeasonEnd(createUniverse(5)).raceResults[0].data), 'New results carry a replay');

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const lowMean = mean(lowTracks);
const highMean = mean(highTracks);
const midMean = mean(midTracks);
const allMean = mean([...lowTracks, ...midTracks, ...highTracks]);
assert.ok(allMean >= 15 && allMean <= 60, `Average overtakes per race should be 15–60, got ${allMean.toFixed(1)}`);
assert.ok(highMean >= 25 && highMean <= 70, `High-overtake circuits should average 25–70 passes, got ${highMean.toFixed(1)}`);
assert.ok(lowMean <= highMean * 0.5, `Monaco-like circuits need far fewer passes (${lowMean.toFixed(1)} vs ${highMean.toFixed(1)})`);
assert.ok(lowMean >= 3, `Even tight circuits should see some passing, got ${lowMean.toFixed(1)}`);

console.log('Race replay validation passed:', {
  seasons: summary,
  overtakesPerRace: { lowOvertakeTracks: Number(lowMean.toFixed(1)), midTracks: Number(midMean.toFixed(1)), highOvertakeTracks: Number(highMean.toFixed(1)), all: Number(allMean.toFixed(1)) },
});

// ---- Showcase gate and highlights director (Phase 2).
{
  const { simulateWeeks, simulateThroughF1Event, showcaseReason, isTitleDecider } = await import('../src/sim.js');
  const { buildDirectorScript } = await import('../src/director.js');
  const base = createUniverse(4242);
  base.settings.showcase = { deciders: false, wet: false, classics: false, all: true };
  const gated = simulateWeeks(base, 8, { showcase: true });
  assert.equal(gated.competitionEventResults.F1.length, 0, 'The gate must stop before the first chosen F1 race');
  assert.ok(gated.showcase?.pending?.eventId === base.calendar[0].id, 'The pending showcase race must be exposed');
  assert.ok(gated.drivers.every((driver) => driver.series !== 'F1' || driver.season.points === 0), 'No F1 points may exist before the showcase race is watched');
  const again = simulateWeeks(gated, 4, { showcase: true });
  assert.equal(again.currentWeek, gated.currentWeek, 'The clock must not move past an unwatched showcase race');
  const watched = simulateThroughF1Event(gated, gated.showcase.pending.eventId);
  const free = simulateThroughF1Event(createUniverse(4242), base.calendar[0].id);
  assert.equal(watched.competitionEventResults.F1.length, 1);
  assert.deepEqual(watched.competitionEventResults.F1[0].sessions.R.rows.map((row) => [row.driverId, row.points]), free.competitionEventResults.F1[0].sessions.R.rows.map((row) => [row.driverId, row.points]), 'Pausing at the gate must not change the race result');
  const ungated = simulateWeeks(createUniverse(4242), 8);
  assert.ok(ungated.competitionEventResults.F1.length > 0 && !ungated.showcase, 'Without the option the gate is off');
  const noneSet = createUniverse(4242); noneSet.settings.showcase = { deciders: false, wet: false, classics: false, all: false };
  assert.equal(showcaseReason(noneSet, noneSet.calendar[0]), null);
  assert.equal(isTitleDecider(createUniverse(4242), base.calendar[0]), false, 'Round one cannot decide a title');

  const season = simulateToSeasonEnd(createUniverse(17));
  const durations = [];
  for (const record of season.competitionEventResults.F1) {
    const highlights = buildDirectorScript(record.sessions.R, 'highlights');
    durations.push(highlights.duration / 1000);
    assert.equal(highlights.beats[0].kind, 'grid');
    assert.ok(highlights.beats.some((beat) => beat.kind === 'start'));
    assert.equal(highlights.beats.at(-1).kind, 'finish');
    assert.ok(highlights.beats.filter((beat) => beat.kind === 'closing').length >= 2, 'Highlights must include the closing laps');
    const picked = highlights.beats.filter((beat) => beat.kind === 'moment' || beat.kind === 'flag').reduce((sum, beat) => sum + beat.moments.length, 0);
    assert.ok(picked >= 8 && picked <= 22, `Highlights should feature about 10–20 moments, got ${picked}`);
    assert.equal(buildDirectorScript(record.sessions.R, 'result').beats.length, 1);
  }
  const meanDuration = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  assert.ok(meanDuration >= 55 && meanDuration <= 95, `Highlights should last about 60–90 s at 1x, mean ${meanDuration.toFixed(1)} s`);
  assert.ok(durations.every((value) => value >= 40 && value <= 120), 'Every highlights reel must stay watchable');
  console.log('Showcase gate and director validation passed:', { highlightsSeconds: { min: Math.round(Math.min(...durations)), mean: Math.round(meanDuration), max: Math.round(Math.max(...durations)) } });
}
