import assert from 'node:assert/strict';
import { createUniverse } from '../src/data.js';
import { advanceToNextSeason, driverStandings, simulateWeekend } from '../src/sim.js';

const output=[];
for (const seed of [17,20260731]) {
  let universe=createUniverse(seed);const champions=new Map();let worstShare=0;let worstWins=0;let totalMoves=0;let renewals=0;
  for(let season=0;season<10;season+=1){
    for(let round=0;round<universe.calendar.length;round+=1) universe=simulateWeekend(universe);
    universe.phase='Season complete';
    const table=driverStandings(universe,'F1');const champion=table[0];const races=universe.competitionEventResults.F1.length||universe.raceResults.length;const maxWins=Math.max(...table.map((d)=>d.season.wins));
    worstWins=Math.max(worstWins,maxWins);worstShare=Math.max(worstShare,maxWins/races);champions.set(champion.id,(champions.get(champion.id)||0)+1);
    universe=advanceToNextSeason(universe);const thisMarket=(universe.marketHistory||[]).filter((m)=>m.year===universe.year);totalMoves+=thisMarket.filter((m)=>m.from.teamId!==m.to.teamId).length;renewals+=thisMarket.filter((m)=>m.from.teamId===m.to.teamId).length;
    const driverCounts=new Map();for(const move of thisMarket)driverCounts.set(move.driverId,(driverCounts.get(move.driverId)||0)+1);
    assert.ok([...driverCounts.values()].every((count)=>count===1),'A driver changed or renewed more than once in one market');
  }
  assert.ok(worstShare<.72,'Long-run dominance exceeded intended ceiling');
  assert.ok(champions.size>=3,'Ten seasons should produce at least three champions');
  output.push({seed,champions:champions.size,worstWins,worstShare:Number(worstShare.toFixed(3)),teamChanges:totalMoves,renewals});
}
console.log('10-season F1 balance validation passed:',output);
