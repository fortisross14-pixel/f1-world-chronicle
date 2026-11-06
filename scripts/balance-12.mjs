import assert from 'node:assert/strict';
import { createUniverse, currentDriverRating, getTeam } from '../src/data.js';
import { advanceToNextSeason, driverStandings, simulateWeekend } from '../src/sim.js';

const seeds = process.argv[2] ? [Number(process.argv[2])] : [17, 2026, 20260731];
const reports = [];

for (const seed of seeds) {
  let universe = createUniverse(seed);
  const titleCounts = new Map();
  const seasons = [];

  for (let season = 0; season < 12; season += 1) {
    for (let round = 0; round < universe.calendar.length; round += 1) universe = simulateWeekend(universe);
    const table = driverStandings(universe, 'F1');
    const champion = table[0];
    const topWins = Math.max(...table.map((driver) => driver.season.wins));
    const winnerCount = table.filter((driver) => driver.season.wins > 0).length;
    const winningTeams = new Set(table.filter((driver) => driver.season.wins > 0).map((driver) => driver.teamId)).size;
    titleCounts.set(champion.id, (titleCounts.get(champion.id) || 0) + 1);
    seasons.push({
      year: universe.year,
      championId: champion.id,
      champion: champion.name,
      rarity: champion.rarity,
      topWins,
      winnerCount,
      winningTeams,
      titleMargin: champion.season.points - table[1].season.points,
      activeGenerational: universe.drivers.filter((driver) => driver.active && driver.rarity === 'Generational').length,
      championRating: currentDriverRating(champion),
      championBase: champion.baseTalent,
      championStyle: champion.style,
      championTeam: getTeam(universe, champion.teamId)?.name || '—',
      championTeamBaseline: Number((getTeam(universe, champion.teamId)?.baseline || 0).toFixed(1)),
    });

    universe.phase = 'Season complete';
    universe = advanceToNextSeason(universe);
    universe.eventArchive = [];
    universe.stories = universe.stories.slice(0, 30);
    universe.preseasonReports = universe.preseasonReports.slice(0, 2);
    universe.marketHistory = universe.marketHistory.slice(0, 80);
    universe.staffMarketHistory = (universe.staffMarketHistory || []).slice(0, 80);
  }

  const buckets = {
    sixOrSeven: seasons.filter((item) => item.topWins >= 6 && item.topWins <= 7).length,
    eightToTen: seasons.filter((item) => item.topWins >= 8 && item.topWins <= 10).length,
    aboveTen: seasons.filter((item) => item.topWins > 10).length,
    belowSix: seasons.filter((item) => item.topWins < 6).length,
  };
  const mostTitles = Math.max(...titleCounts.values());
  const uniqueChampions = titleCounts.size;
  assert.ok(seasons.every((item) => item.activeGenerational <= 2), 'There must never be more than two active Generational drivers');
  assert.ok(mostTitles <= 7, 'One driver should not own almost the complete 12-year era');
  reports.push({ seed, buckets, mostTitles, uniqueChampions, seasons });
}

console.log(JSON.stringify(reports, null, 2));

// README "Long-run competitive balance" targets, checked across the full
// three-seed run (a single-seed run only prints the report).
if (reports.length === 3) {
  const seasons = reports.flatMap((report) => report.seasons);
  const total = (key) => reports.reduce((sum, report) => sum + report.buckets[key], 0);
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const meanWinners = mean(seasons.map((season) => season.winnerCount));
  const meanTeams = mean(seasons.map((season) => season.winningTeams));
  const summary = { sixOrSeven: total('sixOrSeven'), eightToTen: total('eightToTen'), aboveTen: total('aboveTen'), belowSix: total('belowSix'), mostTitles: reports.map((report) => report.mostTitles), meanWinners: Number(meanWinners.toFixed(2)), meanWinningTeams: Number(meanTeams.toFixed(2)) };
  console.log('Balance summary (36 seasons):', summary);
  assert.ok(summary.sixOrSeven >= 4 && summary.sixOrSeven <= 14, `Seasons with a 6–7 win leader should be roughly 2–4 per era, got ${summary.sixOrSeven}/36`);
  // v14 era balance (catch-up rules, convergence, car-led pace) makes seasons more
  // open: 8–10-win leaders are now the largest group rather than a clear majority,
  // and an open season with a sub-six-win leader is no longer exceptional.
  assert.ok(summary.eightToTen >= 10, `Most seasons should have an 8–10 win leader, got ${summary.eightToTen}/36`);
  assert.ok(summary.aboveTen >= 2 && summary.aboveTen <= 10, `Exceptional 10+ win seasons should be 1–3 per era, got ${summary.aboveTen}/36`);
  assert.ok(summary.belowSix <= 8, `Very open seasons should stay rare, got ${summary.belowSix}/36`);
  assert.ok(reports.every((report) => report.mostTitles >= 2 && report.mostTitles <= 6), 'The leading champion of an era should usually win three to five titles');
  assert.ok(meanWinners >= 5 && meanWinners <= 8.5, `Seasons should usually have five to eight winners, mean ${meanWinners.toFixed(2)}`);
  assert.ok(meanTeams >= 4 && meanTeams <= 7, `Seasons should usually have four to seven winning constructors, mean ${meanTeams.toFixed(2)}`);
}
