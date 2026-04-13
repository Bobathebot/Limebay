var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// ===== FIX 1: BIKE COUNTING - NEAREST BAY ONLY =====
var start = c.indexOf('function bikesAt(');
if (start === -1) { console.log("ERROR: bikesAt not found"); process.exit(1); }
var depth = 0;
var pos = c.indexOf('{', start);
var end = pos;
for (var i = pos; i < c.length; i++) {
  if (c[i] === '{') depth++;
  if (c[i] === '}') depth--;
  if (depth === 0) { end = i + 1; break; }
}
var oldFn = c.substring(start, end);
console.log("Found bikesAt, replacing...");

var newFn = `function bikesAt(bay){
  var count=0;
  bMarks.forEach(function(mk){
    var l=mk.getLatLng();
    var d1=dist(bay.lat,bay.lng,l.lat,l.lng);
    if(d1>zData.radius)return;
    var dominated=false;
    for(var j=0;j<bays.length;j++){
      if(bays[j]===bay)continue;
      var d2=dist(bays[j].lat,bays[j].lng,l.lat,l.lng);
      if(d2<d1){dominated=true;break}
    }
    if(!dominated)count++;
  });
  return count;
}`;
c = c.substring(0, start) + newFn + c.substring(end);
console.log("bikesAt fixed!");

// ===== FIX 2: SCHEDULED CHECKS =====
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
  banner.innerHTML=(urgent?"\\u26a0\\ufe0f ":"\\u23f0 ")+"Next: <b>"+next.sched.time+"</b> "+next.sched.bays.join(", ")+" <span style='float:right'>"+next.minsLeft+"min</span>";
}
setInterval(updateScheduleBanner,30000);
`;

// Add schedule banner HTML
if (c.indexOf('schedBanner') === -1) {
  c = c.replace(
    '<div id="bikeCount">',
    '<div id="schedBanner" style="display:none;position:fixed;top:62px;left:0;right:0;z-index:997;padding:6px 12px;font-size:11px;font-weight:600;color:#fff"></div>\n<div id="bikeCount">'
  );
  console.log("Schedule banner HTML added");
}

// Add schedule code before init
if (c.indexOf('WM_SCHEDULE') === -1) {
  c = c.replace('// Init', schedCode + '\n// Init');
  c = c.replace('drawBoundary();renderBays();', 'drawBoundary();renderBays();updateScheduleBanner();');
  console.log("Schedule JS added");

  // Boost scheduled bays in route planning
  var oldScore = 'var score=d2-(remC[k].totalBikes*15)+bonus;';
  if (c.indexOf(oldScore) !== -1) {
    c = c.replace(oldScore, `var schedBonus=0;
      var nextChk=getNextCheck();
      if(nextChk&&nextChk.minsLeft<=30){
        remC[k].items.forEach(function(x){
          if(nextChk.sched.bays.indexOf(x.bay.name)!==-1)schedBonus-=1000;
        });
      }
      var score=d2-(remC[k].totalBikes*15)+bonus+schedBonus;`);
    console.log("Route plan schedule boost added");
  }
}

// ===== VERIFY =====
var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){console.log("Line "+(i+1)+": "+e2.message);console.log(lines[i].substring(0,100));break}}
  process.exit(1);
}

fs.writeFileSync('index.html', c);
console.log("All fixes applied!");
