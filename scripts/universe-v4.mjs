import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import {
  RARITY, assignRosterHierarchy, countryIso2, createUniverse, currentDriverRating,
  effectiveDriverSkill, getDriver, getStaff, getTeam,
} from '../src/data.js';
import { advanceToNextSeason, simulateToSeasonEnd, simulateWeeks } from '../src/sim.js';

const expectedColors={Generational:'#e10600',Legend:'#f4c542',Epic:'#a86bff',Rare:'#4da8ff',Uncommon:'#55c978',Common:'#f4f4f6'};
for(const [rarity,color] of Object.entries(expectedColors))assert.equal(RARITY[rarity].color,color,`${rarity} color must match the shared Chronicle language`);

let universe=createUniverse(20260731);
const allTeams=[...universe.teams,...Object.values(universe.feederTeams).flat()];
assert.ok(allTeams.length>50,'The universe should contain every active championship team');

// Every organization is navigable and uses 1–10 facilities.
for(const team of allTeams){
  assert.equal(getTeam(universe,team.id)?.id,team.id,`${team.name} must be navigable`);
  for(const [facility,value] of Object.entries(team.facilities||{})){
    assert.ok(value>=1&&value<=10,`${team.name} ${facility} must use the 1–10 scale`);
  }
  const roster=universe.drivers.filter((driver)=>driver.active&&driver.role==='Race driver'&&driver.teamId===team.id).sort((a,b)=>a.seat-b.seat);
  const engineers=(team.staffIds||[]).map((id)=>getStaff(universe,id)).filter((member)=>member?.role==='Race Engineer');
  assert.equal(engineers.length,roster.length,`${team.name} needs one race engineer per race seat`);
  assert.deepEqual(engineers.map((member)=>member.assignedSeat).sort((a,b)=>a-b),roster.map((driver)=>driver.seat),`${team.name} engineers must be tied to explicit seats`);
  assert.ok((team.staffIds||[]).every((id)=>getStaff(universe,id)),`${team.name} staff links must resolve`);
}

// Initial grids may contain rookies, prime drivers and careers already near retirement.
const activeRaceDrivers=universe.drivers.filter((driver)=>driver.active&&driver.role==='Race driver');
assert.ok(activeRaceDrivers.some((driver)=>driver.age>=36),'Initial generation should include veterans');
assert.ok(activeRaceDrivers.some((driver)=>driver.debutAge+driver.careerLength-driver.age<=1),'Initial generation should include a final-year career');
assert.ok(activeRaceDrivers.some((driver)=>driver.age<=18),'Initial generation should include teenage prospects');

// Displayed and simulated skills must reflect the current career year rather than raw ceiling.
const developing=activeRaceDrivers.find((driver)=>driver.baseTalent>=90&&driver.careerMultiplier<.9);
assert.ok(developing,'Seed should create an elite driver early on the career curve');
assert.ok(currentDriverRating(developing)<developing.baseTalent,'Current ability must remain below base ceiling while developing');
assert.ok(Object.keys(developing.skills).some((key)=>effectiveDriverSkill(developing,key)<developing.skills[key]),'At least one visible skill must be reduced by the career curve');
assert.ok(Object.keys(developing.skills).some((key)=>effectiveDriverSkill(developing,key)<100),'A developing elite driver cannot display a wall of 100s');

// Hierarchy uses current quality, experience, team tenure and success—not rarity alone.
const template=structuredClone(activeRaceDrivers[0]);
const veteran={...structuredClone(template),id:'hierarchy-veteran',teamId:'hierarchy-team',name:'Veteran Champion',age:33,debutAge:24,teamJoinedYear:1,seat:2,rarity:'Epic',career:{...template.career,titles:2,f1Wins:20,f1Podiums:50,seriesTitles:0},season:{...template.season,points:0,wins:0},careerCurve:[1],curveIndex:0,careerMultiplier:1,annualForm:1,confidence:65,skills:Object.fromEntries(Object.keys(template.skills).map((key)=>[key,86]))};
const prospect={...structuredClone(template),id:'hierarchy-prospect',teamId:'hierarchy-team',name:'Young Legend',age:20,debutAge:18,teamJoinedYear:1,seat:1,rarity:'Legend',career:{...template.career,titles:0,f1Wins:0,f1Podiums:0,seriesTitles:0},season:{...template.season,points:0,wins:0},careerCurve:[.82],curveIndex:0,careerMultiplier:.82,annualForm:1,confidence:65,skills:Object.fromEntries(Object.keys(template.skills).map((key)=>[key,99]))};
let hierarchy=assignRosterHierarchy([prospect,veteran],'hierarchy-team',1);
assert.equal(hierarchy[0].id,veteran.id,'A proven two-time champion should lead a still-developing prospect');
prospect.careerCurve=[1.02];prospect.careerMultiplier=1.02;prospect.age=25;prospect.debutAge=18;prospect.teamJoinedYear=2024;prospect.career.f1Wins=8;
veteran.career.titles=0;veteran.career.f1Wins=2;veteran.skills=Object.fromEntries(Object.keys(veteran.skills).map((key)=>[key,75]));
hierarchy=assignRosterHierarchy([prospect,veteran],'hierarchy-team',4);
assert.equal(hierarchy[0].id,prospect.id,'A developed star should be able to earn Driver 1 status later');

// Flags are bundled locally for drivers, staff, teams and venues.
const countries=new Set([
  ...universe.drivers.map((driver)=>driver.countryCode||driver.country),
  ...universe.staff.map((member)=>member.country),
  ...allTeams.map((team)=>team.country),
  ...Object.values(universe.competitionCalendars).flat().map((event)=>event.country),
]);
for(const country of countries)await access(new URL(`../public/flags/${countryIso2(country).toLowerCase()}.png`,import.meta.url));

// Time simulation advances the whole world, not just Formula 1.
universe=simulateWeeks(universe,4);
const activeSeries=Object.entries(universe.competitionEventResults).filter(([,events])=>events.length>0).map(([series])=>series);
assert.ok(activeSeries.length>=5,'A four-week simulation should complete events across most championships');
assert.equal(universe.currentWeek,5);

// Full year and off-season apply facility decay/investment and support-series finances.
universe=simulateToSeasonEnd(universe);
assert.equal(universe.phase,'Season complete');
universe=advanceToNextSeason(universe);
assert.equal(universe.phase,'Pre-season');
for(const team of [...universe.teams,...Object.values(universe.feederTeams).flat()]){
  assert.ok(Number.isFinite(team.finances?.totalIncome)&&team.finances.totalIncome>0,`${team.name} needs visible income`);
  assert.ok(Number.isFinite(team.finances?.totalExpenses)&&team.finances.totalExpenses>0,`${team.name} needs visible expenses`);
  assert.ok(Number.isFinite(team.finances?.projectedBalance),`${team.name} needs a visible balance`);
  assert.ok(Object.values(team.facilities||{}).every((value)=>value>=1&&value<=10),`${team.name} facilities must remain bounded after decay and investment`);
}

console.log('Universe v4 validation passed:',{
  teams:allTeams.length,
  staff:universe.staff.length,
  developingDriver:developing.name,
  seriesSimulated:activeSeries,
});
