import { createUniverse } from '../src/data.js';
import { advanceToNextSeason, simulateToSeasonEnd } from '../src/sim.js';

const median = (values) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] || 0;
};
const average = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

let universe = createUniverse(20260731);
const rows = [];
for (let season = 0; season < 3; season += 1) {
  universe = advanceToNextSeason(simulateToSeasonEnd(universe));
  const teams = [...universe.teams, ...Object.values(universe.feederTeams).flat()];
  const cash = teams.map((team) => team.finances?.cash || 0);
  const facilityAverages = teams.map((team) => average(Object.values(team.facilities || {})));
  rows.push({
    year: universe.year,
    minCash: Math.min(...cash),
    medianCash: median(cash),
    maxCash: Math.max(...cash),
    averageFacility: Number(average(facilityAverages).toFixed(2)),
    highestFacilityAverage: Number(Math.max(...facilityAverages).toFixed(2)),
    largestFacilityInvestment: Math.max(...teams.map((team) => team.finances?.facilityInvestment || 0)),
  });
}
console.table(rows);
