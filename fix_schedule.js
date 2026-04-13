var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Add schedule data and countdown timer
var schedCode = `
var WM_SCHEDULE=[
  {time:"08:30",bays:["George Street","Baker Street (S)","Blandford St"]},
  {time:"10:00",bays:["George Street","Baker Street (S)","Blandford St"]},
  {time:"12:00",bays:["George Street","Baker Street (S)","Blandford St"]},
  {time:"14:00",bays:["George Street","Baker Street (S)","Blandford St"]},
  {time:"15:30",bays:["George Street","Baker Street (S)","Blandford St"]}
];

function getNextCheck(){
  if(curZone!=="wm")return null;
  var now=new Date();
  var nowMin=now.getHours()*60+now.getMinutes();
  for(var i=0;i<WM_SCHEDULE.length;i++){
    var parts=WM_SCHEDULE[i].time.split(":");
    var schedMin=parseInt(parts[0])*60+parseInt(parts[1]);
    if(schedMin>nowMin)return{sched:WM_SCHEDULE[i],minsLeft:schedMin-nowMin};
  }
  return null;
}

function updateScheduleBanner(){
  var banner=document.getElementById("schedBanner");
  if(!banner)return;
  var next=getNextCheck();
  if(!next){banner.style.display="none";return}
  banner.style.display="block";
  var urgent=next.minsLeft<=15;
  banner.style.background=urgent?"rgba(255,69,58,.9)":"rgba(255,159,10,.85)";
  banner.innerHTML=(urgent?"\\u26a0\\ufe0f ":"\\u23f0 ")+"Next check: <b>"+next.sched.time+"</b> — "+next.sched.bays.join(", ")+" <span style='float:right'>"+next.minsLeft+" min</span>";
}
setInterval(updateScheduleBanner,30000);
`;

// Add the schedule banner HTML after zonebar
c = c.replace(
  '<div id="bikeCount">',
  '<div id="schedBanner" style="display:none;position:fixed;top:62px;left:0;right:0;z-index:998;padding:6px 12px;font-size:11px;font-weight:600;color:#fff;z-index:997"></div>\n<div id="bikeCount" style="position:fixed;top:85px;right:10px;z-index:998;background:#32D74B;color:#000;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:700">'
);

// Fix the duplicate bikeCount style
c = c.replace(
  '#bikeCount{position:fixed;top:68px;right:10px;z-index:998;background:#32D74B;color:#000;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:700}',
  '#bikeCount{}'
);

// Insert schedule code before the init section
c = c.replace(
  "// Init",
  schedCode + "\n// Init"
);

// Call updateScheduleBanner on init
c = c.replace(
  'drawBoundary();renderBays();',
  'drawBoundary();renderBays();updateScheduleBanner();'
);

// Make route plan prioritise scheduled bays when check is within 30 min
var oldRouteScore = 'var score=d2-(remC[k].totalBikes*15)+bonus;';
var newRouteScore = `var schedBonus=0;
      var nextChk=getNextCheck();
      if(nextChk&&nextChk.minsLeft<=30){
        remC[k].items.forEach(function(x){
          if(nextChk.sched.bays.indexOf(x.bay.name)!==-1)schedBonus-=1000;
        });
      }
      var score=d2-(remC[k].totalBikes*15)+bonus+schedBonus;`;
c = c.replace(oldRouteScore, newRouteScore);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){console.log("Line "+(i+1)+": "+e2.message);console.log(lines[i].substring(0,100));break}}
  process.exit(1);
}
fs.writeFileSync('index.html', c);
console.log("Schedule alerts + route integration added!");
