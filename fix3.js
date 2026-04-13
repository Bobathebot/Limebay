var fs = require('fs');

// ===== FIX 1: Camera - white text, NO dark background =====
var c = fs.readFileSync('index.html', 'utf8');

// Fix live overlay - remove dark background, keep white text with shadow
c = c.replace(
  'id="camOvr" style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.75);padding:8px 10px"',
  'id="camOvr" style="position:absolute;top:0;right:0;padding:10px 12px;text-align:right"'
);
// If already changed to top:0 from previous fix
c = c.replace(
  'id="camOvr" style="position:absolute;top:0;left:0;right:0;padding:8px 10px;text-align:right"',
  'id="camOvr" style="position:absolute;top:0;right:0;padding:10px 12px;text-align:right"'
);

// Fix all overlay text to white with strong shadow, no matter current color
c = c.replace(/"oTime">/, '"oTime" style="color:#fff;font-size:12px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">');
// Remove any existing inline style on oTime div
c = c.replace(/<div style="color:#[^"]*" id="oTime"[^>]*>/, '<div id="oTime" style="color:#fff;font-size:12px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">');
c = c.replace(/<div style="color:#[^"]*" id="oAddr">/, '<div id="oAddr" style="color:#fff;font-size:10px;line-height:1.5;margin-top:2px;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">');
c = c.replace(/<div style="color:#[^"]*" id="oCoord">/, '<div id="oCoord" style="color:#fff;font-size:9px;margin-top:2px;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">');

// Fix burned photo: no dark bar, white text, top-right aligned
// Remove the dark background rect
c = c.replace(
  'ctx.fillStyle="rgba(0,0,0,.72)";ctx.fillRect(0,by,cv.width,bh);',
  '// no background bar'
);
// If already replaced
c = c.replace('// No dark background - just text with shadow', '// no background bar');

// Move text to top-right
c = c.replace(
  /var fs2=Math\.round\(cv\.width\*0\.02[48]\);var pad=fs2\*0\.8;var lh=fs2\*1\.45;var bh=lines\.length\*lh\+pad\*2;var by=cv\.height-bh;/,
  'var fs2=Math.round(cv.width*0.028);var pad=fs2*0.8;var lh=fs2*1.45;var by=pad;'
);

// White text, right-aligned, strong shadow
c = c.replace(
  /for\(var li=0;li<lines\.length;li\+\+\)\{ctx\.font=fs2\+"px[^}]+\}/,
  'ctx.textAlign="right";for(var li=0;li<lines.length;li++){ctx.font=fs2+"px -apple-system,Helvetica,sans-serif";ctx.fillStyle="#FFFFFF";ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=5;ctx.shadowOffsetX=1;ctx.shadowOffsetY=1;ctx.fillText(lines[li],cv.width-pad,by+pad+lh*(li+0.75))}'
);

// ===== FIX 2: Separate Refresh Bikes and Reset buttons =====
// Replace single "Refresh + Reset" with two buttons
c = c.replace(
  '<button class="btn bg" onclick="refreshBikes()">Refresh + Reset</button>',
  '<button class="btn bg" onclick="refreshOnly()">Refresh Bikes</button>'
);

// Add refreshOnly function (loads bikes without resetting bays)
var refreshOnlyFn = `
function refreshOnly(){
  toast("Loading bikes...");
  fetch("/api/bikes?zone="+curZone).then(function(r){return r.json()}).then(function(d){
    bMarks.forEach(function(m){map.removeLayer(m)});bMarks=[];
    if(d.bikes){d.bikes.forEach(function(bk){bMarks.push(L.marker([bk.lat,bk.lng],{icon:iB}).addTo(map))})}
    document.getElementById("bikeCount").textContent=(d.count||0)+" bikes";
    renderBays();toast((d.count||0)+" bikes loaded");
  }).catch(function(){document.getElementById("bikeCount").textContent="error"});
}
`;
c = c.replace('function refreshBikes(){', refreshOnlyFn + '\nfunction refreshBikes(){');

// Add a Reset button in the second row
c = c.replace(
  '<button class="btn bo" onclick="nearestBay()">Nearest</button>',
  '<button class="btn bo" onclick="nearestBay()">Nearest</button></div><div class="row"><button class="btn br" onclick="resetBays()">Reset Bays</button>'
);

// Add resetBays function
var resetFn = `
function resetBays(){
  if(!confirm("Reset all bays?"))return;
  bays.forEach(function(b){b.ts=null;b.at=null});
  ss=null;localStorage.removeItem(SHIFT_KEY);
  save();renderBays();toast("Bays reset");
}
`;
c = c.replace('function refreshBikes(){', resetFn + '\nfunction refreshBikes(){');

// Verify
var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){
    try { new Function(lines.slice(0,i+1).join('\n')); } catch(e2) {
      console.log("At line "+(i+1)+": "+e2.message);
      console.log(lines[i].substring(0,100));
      break;
    }
  }
  process.exit(1);
}
fs.writeFileSync('index.html', c);
console.log("index.html fixed!");

// ===== FIX 3: Westminster needs more strips =====
var proxy = fs.readFileSync('proxy.py', 'utf8');

// Replace single WM zone with 4 strips
proxy = proxy.replace(
  `WM_ZONES = [
    {"ne_lat":51.527,"ne_lng":-0.148,"sw_lat":51.515,"sw_lng":-0.166,"user_latitude":51.520,"user_longitude":-0.157},
]`,
  `WM_ZONES = [
    {"ne_lat":51.528,"ne_lng":-0.155,"sw_lat":51.520,"sw_lng":-0.168,"user_latitude":51.524,"user_longitude":-0.162},
    {"ne_lat":51.528,"ne_lng":-0.145,"sw_lat":51.520,"sw_lng":-0.155,"user_latitude":51.524,"user_longitude":-0.150},
    {"ne_lat":51.520,"ne_lng":-0.155,"sw_lat":51.514,"sw_lng":-0.168,"user_latitude":51.517,"user_longitude":-0.162},
    {"ne_lat":51.520,"ne_lng":-0.145,"sw_lat":51.514,"sw_lng":-0.155,"user_latitude":51.517,"user_longitude":-0.150},
]`
);

// Expand WM bounding box filter
proxy = proxy.replace(
  'return 51.514 <= lat <= 51.528 and -0.167 <= lng <= -0.147',
  'return 51.513 <= lat <= 51.529 and -0.169 <= lng <= -0.144'
);

fs.writeFileSync('proxy.py', proxy);
console.log("proxy.py fixed - 4 WM strips!");
