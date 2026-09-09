const tutorials = [
  {
    id: "harvest",
    title: "Something worth growing",
    text: "Harvest two golden clover plots. Your herd will thank you.",
    value: (s) => s.harvests,
    goal: 2,
    reward: 50,
  },
  {
    id: "care",
    title: "A little kindness",
    text: "Feed or water animals six times. Build a thriving home.",
    value: (s) => s.care,
    goal: 6,
    reward: 80,
  },
  {
    id: "adult",
    title: "Room to grow",
    text: "Nurture a cow until she reaches adulthood.",
    value: (s) => (s.cows.some((c) => c.growth >= 100) ? 1 : 0),
    goal: 1,
    reward: 80,
  },
  {
    id: "birth",
    title: "A new beginning",
    text: "Select a healthy adult cow and call the breeding robot. Welcome your first calf.",
    value: (s) => s.births,
    goal: 1,
    reward: 120,
  },
  {
    id: "herd",
    title: "A flourishing herd",
    text: "Grow your family to five cows. Every expected calf has a reserved place.",
    value: (s) => s.cows.length,
    goal: 5,
    reward: 180,
  },
];

const count = (s,key) => Number.isFinite(s[key]) ? Math.max(0,s[key]) : 0;
const activities = [
  ['harvests','Harvest season','Harvest {n} plots. Your citizens can help.',3],
  ['care','Kind hands','Feed or water animals {n} times.',4],
  ['sales','Market day','Sell {n} harvested crop units in the General Store.',8],
  ['enemiesDefeated','Protect the valley','Defeat {n} enemies together with your defenders.',3],
  ['spellsCast','Practice your magic','Successfully cast {n} spells. Failed casts do not count.',3],
];
export function chapter(level) {
  if(level<=5)return {...tutorials[level-1],level,reward:(2*level-1)*100};
  const [key,title,text,base]=activities[(level-6)%activities.length];
  const goal=base+Math.floor((level-6)/10);
  return {id:`chapter-${level}`,level,key,title,text:text.replace('{n}',goal),goal,reward:(2*level-1)*100};
}
export const CHAPTERS=Array.from({length:100},(_,i)=>chapter(i+1));
export function currentQuest(s){
  let q=CHAPTERS.find(q=>!s.completed.includes(q.id));
  if(!q){let level=101;while(s.completed.includes(`chapter-${level}`))level++;q=chapter(level);}
  if(q.key){
    if(s.questProgress?.id!==q.id)s.questProgress={id:q.id,baseline:count(s,q.key)};
    if(!Number.isFinite(s.questProgress.baseline))s.questProgress.baseline=count(s,q.key);
  }
  const progress=q.key?Math.max(0,count(s,q.key)-s.questProgress.baseline):q.value(s);
  return {...q,progress:Math.min(q.goal,progress),gold:30+q.level*5};
}
export function claimQuest(world){
  const s=world.state,q=currentQuest(s);
  if(q.progress<q.goal||s.completed.includes(q.id))return false;
  s.completed.push(q.id);s.questProgress=null;
  world.award(q.reward);s.coins+=q.gold;
  world.notify(`Chapter ${q.level} complete · +${q.reward} XP and ${q.gold} gold`);
  currentQuest(s);
  return true;
}
