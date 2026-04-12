var fs = require('fs');

var html = [
'<!DOCTYPE html>',
'<html lang="en">',
'<head>',
'<meta charset="UTF-8">',
'<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">',
'<title>LimeBay</title>',
'<meta name="apple-mobile-web-app-capable" content="yes">',
'<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
'<meta name="apple-mobile-web-app-title" content="LimeBay">',
'<link rel="stylesheet" href="leaflet.css"/>',
'<script src="leaflet.js"><\/script>',
'<style>',
'*{margin:0;padding:0;box-sizing:border-box}',
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#111;color:#fff;overflow:hidden}',
'#map{width:100vw;height:100vh}',
'#topbar{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);padding:10px 16px;display:flex;align-items:center;justify-content:space-between}',
'#topbar h1{font-size:17px;color:#32D74B}',
'#topbar .stats{font-size:12px;color:#888;text-align:right}',
'#topbar .stats b{color:#32D74B}',
'.pace{font-size:11px;color:#FF9F0A;margin-top:2px}',
'#controls{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);padding:10px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom))}',
'#controls .row{display:flex;gap:6px;margin-bottom:6px}',
'#controls .row:last-child{margin-bottom:0}',
'.btn{flex:1;padding:11px 6px;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;text-align:center}',
'.btn:active{opacity:.7}',
'.bg{background:#32D74B;color:#000}.br{background:#FF453A;color:#fff}.bb{background:#0A84FF;color:#fff}.bo{background:#FF9F0A;color:#000}.bk{background:#333;color:#fff}.bp{background:#BF5AF2;color:#fff}',
'#bikeCount{position:fixed;top:50px;right:12px;z-index:1000;background:#32D74B;color:#000;padding:5px 10px;border-radius:16px;font-size:12px;font-weight:700}',
'#toast{display:none;position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:3000;background:rgba(50,212,75,.95);color:#000;padding:8px 18px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap}',
'.panel{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:2000;background:rgba(0,0,0,.96);padding:16px;overflow-y:auto}',
'.panel h2{color:#32D74B;margin-bottom:12px}',
'.bay-item{background:#1c1c1e;border-radius:12px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}',
'.bay-item.done{opacity:.45}',
'.bay-name{font-size:14px;font-weight:600}',
'.bay-bikes{color:#32D74B;font-size:12px;font-weight:700}',
'.bay-dist{color:#888;font-size:11px;margin-top:2px}',
'.bay-actions{display:flex;gap:5px}',
'.bay-actions button{padding:6px 10px;border:none;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer}',
'.close-btn{position:fixed;top:14px;right:14px;z-index:2001;background:#FF453A;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer}',
'.popup{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2500;background:#1c1c1e;padding:20px;border-radius:16px;text-align:center;min-width:280px;max-width:90vw}',
'.popup button{display:block;width:250px;margin:6px auto;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}',
'.popup textarea{width:250px;height:60px;padding:10px;border:1px solid #333;border-radius:8px;background:#111;color:#fff;font-size:14px;resize:none;margin-top:8px}',
'</style>',
'</head>',
'<body>',
'<div id="topbar"><h1>LimeBay</h1><div class="stats">Bays: <b id="totalBays">0</b> | Done: <b id="doneBays">0</b> | Left: <b id="leftBays">0</b><div class="pace" id="paceDisplay"></div></div></div>',
'<div id="bikeCount">0 bikes</div>',
'<div id="toast"></div>',
'<div id="map"></div>',
"<div class=\"popup\" id=\"tidyPopup\"><div style=\"font-size:17px;font-weight:700;color:#32D74B;margin-bottom:4px\" id=\"tidyTitle\"></div><div style=\"color:#888;font-size:12px;margin-bottom:12px\" id=\"tidyLabel\"></div><button style=\"background:#32D74B;color:#000\" onclick=\"confirmTidy('tidy')\">Tidy</button><button style=\"background:#0A84FF;color:#fff\" onclick=\"confirmTidy('tidied')\">Tidied</button><button style=\"background:#333;color:#fff\" onclick=\"cP('tidyPopup')\">Cancel</button></div>",
"<div class=\"popup\" id=\"copyPopup\"><div style=\"font-size:14px;font-weight:600;color:#32D74B;margin-bottom:4px\">Tap text then Copy</div><textarea id=\"copyText\" readonly></textarea><button style=\"background:#333;color:#fff\" onclick=\"cP('copyPopup')\">Done</button></div>",
"<div class=\"panel\" id=\"routePanel\"><button class=\"close-btn\" onclick=\"cP('routePanel')\">X</button><h2>Route Plan</h2><div style=\"color:#888;font-size:12px;margin-bottom:12px\" id=\"routeInfo\"></div><div id=\"routeList\"></div></div>",
"<div class=\"panel\" id=\"bayPanel\"><button class=\"close-btn\" onclick=\"cP('bayPanel')\">X</button><h2>All Bays (<span id=\"panelCount\"></span>)</h2><div style=\"margin-bottom:10px;display:flex;gap:6px\"><button class=\"btn bg\" style=\"padding:7px\" onclick=\"fB('all')\">All</button><button class=\"btn bo\" style=\"padding:7px\" onclick=\"fB('todo')\">To Tidy</button><button class=\"btn bk\" style=\"padding:7px\" onclick=\"fB('done')\">Done</button></div><div id=\"bayList\"></div></div>",
'<div id="controls"><div class="row"><button class="btn bg" onclick="refreshBikes()">Refresh + Reset</button><button class="btn bb" onclick="centerMe()">My Location</button></div><div class="row"><button class="btn bp" onclick="showRoute()">Route Plan</button><button class="btn bk" onclick="openBayPanel()">Bays</button><button class="btn bo" onclick="nearestBay()">Nearest</button></div></div>',
'<script>',
].join('\n');

var js = `
var BAY_RADIUS=25;
var STORAGE="limebay_v10";
var SHIFT_KEY="limebay_shift3";
var CENTER=[51.5385,-0.2150];
var DBAYS=[
{n:"Hazel Road",a:51.530683,o:-0.225716},{n:"Station Terrace",a:51.53447,o:-0.219888},
{n:"Wrentham Avenue",a:51.53544,o:-0.219793},{n:"Harvist Road (East)",a:51.534525,o:-0.205179},
{n:"The Avenue (South)",a:51.540984,o:-0.211256},{n:"Cambridge Avenue",a:51.535224,o:-0.193328},
{n:"Coventry Close",a:51.536771,o:-0.192748},{n:"Dyne Road",a:51.544532,o:-0.20154},
{n:"Keslake Road",a:51.533594,o:-0.218408},{n:"Kingswood Avenue",a:51.535821,o:-0.208776},
{n:"Harvist Road (West)",a:51.533963,o:-0.209008},{n:"Waxlow Road",a:51.534911,o:-0.260676},
{n:"Mordaunt Road",a:51.537061,o:-0.257652},{n:"Harlesden Road",a:51.540786,o:-0.23797},
{n:"Donnington Road (East)",a:51.54131,o:-0.227971},{n:"Exeter Road",a:51.547192,o:-0.204983},
{n:"Christchurch Avenue (North)",a:51.546715,o:-0.204368},{n:"Oakhampton Road",a:51.537403,o:-0.22172},
{n:"Uffington Road",a:51.541689,o:-0.232816},{n:"College Road (South)",a:51.535404,o:-0.226326},
{n:"Charteris Road",a:51.538595,o:-0.199107},{n:"Sidmouth Road",a:51.544842,o:-0.221877},
{n:"Malvern Road",a:51.528137,o:-0.197343},{n:"Bathurst Gardens",a:51.533722,o:-0.22629},
{n:"Priory Park Road",a:51.540393,o:-0.196685},{n:"Torbay Road",a:51.54098,o:-0.202733},
{n:"Harvist Road (Mid)",a:51.533885,o:-0.209169},{n:"Aylestone Avenue 1",a:51.54467,o:-0.217687},
{n:"Tiverton Road",a:51.537804,o:-0.216182},{n:"Christchurch Avenue (South)",a:51.540288,o:-0.214513},
{n:"The Avenue (North)",a:51.542315,o:-0.209502},{n:"Coverdale Road",a:51.545115,o:-0.213214},
{n:"Brondesbury Villas",a:51.537675,o:-0.19362},{n:"Victoria Road 1",a:51.535331,o:-0.204989},
{n:"St Julians Road",a:51.541268,o:-0.199203},{n:"Cambridge Road",a:51.532297,o:-0.194179},
{n:"Victoria Road 2",a:51.538751,o:-0.197543},{n:"Aylestone Avenue 2",a:51.542987,o:-0.218791},
{n:"College Road (Mid)",a:51.53374,o:-0.22561},{n:"College Road (North)",a:51.533638,o:-0.225675}
];
var map,uMark,bMarks=[],bayMarks={};
var bays=JSON.parse(localStorage.getItem(STORAGE)||"null");
var uLat=CENTER[0],uLng=CENTER[1];
var ss=localStorage.getItem(SHIFT_KEY)?parseInt(localStorage.getItem(SHIFT_KEY)):null;
var pendTidy=null;
if(!bays){bays=DBAYS.map(function(b){return{name:b.n,lat:b.a,lng:b.o,red:true,ts:null,at:null}});localStorage.setItem(STORAGE,JSON.stringify(bays))}
map=L.map("map",{zoomControl:false}).setView(CENTER,14);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"OSM",maxZoom:19}).addTo(map);
function mkI(e,s){return L.divIcon({html:"<div style='font-size:"+s+"px;text-align:center;line-height:1'>"+e+"</div>",className:"",iconSize:[s,s],iconAnchor:[s/2,s/2]})}
var iB=mkI("\\ud83d\\udfe2",16),iR=mkI("\\ud83d\\udd34",24),iT=mkI("\\ud83e\\uddf9",24),iD=mkI("\\u2705",24),iU=mkI("\\ud83d\\udfe5",22);
function toast(m){var t=document.getElementById("toast");t.textContent=m;t.style.display="block";setTimeout(function(){t.style.display="none"},2500)}
function oP(id){document.getElementById(id).style.display="block"}
function cP(id){document.getElementById(id).style.display="none"}
function dist(a,b,c,d){var R=6371000,dL=(c-a)*Math.PI/180,dN=(d-b)*Math.PI/180;var x=Math.sin(dL/2)*Math.sin(dL/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dN/2)*Math.sin(dN/2);return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function fmtDist(m){return m<1000?Math.round(m)+"m":(m/1000).toFixed(1)+"km"}
function bikesAt(bay){var c=0;bMarks.forEach(function(m){var l=m.getLatLng();if(dist(bay.lat,bay.lng,l.lat,l.lng)<=BAY_RADIUS)c++});return c}
if(navigator.geolocation){navigator.geolocation.watchPosition(function(p){uLat=p.coords.latitude;uLng=p.coords.longitude;if(uMark)uMark.setLatLng([uLat,uLng]);else uMark=L.marker([uLat,uLng],{icon:iU}).addTo(map)},null,{enableHighAccuracy:true})}
function centerMe(){map.setView([uLat,uLng],15)}
function save(){localStorage.setItem(STORAGE,JSON.stringify(bays));stats();pace()}
function stats(){var t=bays.length,d=bays.filter(function(b){return b.ts}).length;document.getElementById("totalBays").textContent=t;document.getElementById("doneBays").textContent=d;document.getElementById("leftBays").textContent=t-d}
function pace(){if(!ss){document.getElementById("paceDisplay").textContent="";return}var d=bays.filter(function(b){return b.ts}).length;if(!d)return;var h=(Date.now()-ss)/3600000;if(h<.01)return;var bph=(d/h).toFixed(1);var col=bph>=6?"#32D74B":bph>=4?"#FF9F0A":"#FF453A";document.getElementById("paceDisplay").innerHTML="<span style='color:"+col+"'>"+bph+" bph</span>"}
function openTidy(i){pendTidy=i;document.getElementById("tidyTitle").textContent=bays[i].name;document.getElementById("tidyLabel").textContent=bays[i].red?"Red star bay":"Bay";oP("tidyPopup")}
function confirmTidy(s){if(pendTidy===null)return;if(!ss){ss=Date.now();localStorage.setItem(SHIFT_KEY,ss)}var b=bays[pendTidy];b.ts=s;b.at=Date.now();var label=b.red?" red star":"";var msg=b.name+label+"\\n"+s;var ta=document.getElementById("copyText");ta.value=msg;oP("copyPopup");ta.focus();ta.select();toast(b.name+" - "+s);save();renderBays();cP("tidyPopup");pendTidy=null}
function undoBay(i){bays[i].ts=null;bays[i].at=null;save();renderBays();toast(bays[i].name+" reset")}
function renderBays(){
Object.keys(bayMarks).forEach(function(k){map.removeLayer(bayMarks[k])});bayMarks={};
bays.forEach(function(bay,i){
var ic=iR;if(bay.ts==="tidy")ic=iT;if(bay.ts==="tidied")ic=iD;
var cm="https://citymapper.com/directions?endcoord="+bay.lat+","+bay.lng+"&endname="+encodeURIComponent(bay.name);
var bc=bikesAt(bay);
var bikeInfo=bc>0?"<span style='color:#32D74B;font-weight:700'>"+bc+" bikes</span><br>":"";
var pop="<b>"+bay.name+"</b>"+(bay.red?" <span style='color:#FF453A'>RED</span>":"")+"<br>"+bikeInfo+(bay.ts?(bay.ts==="tidy"?"Tidy":"Tidied"):"Not done")+(bay.at?"<br><span style='color:#888;font-size:11px'>"+new Date(bay.at).toLocaleTimeString()+"</span>":"")+"<br><a href='"+cm+"' target='_blank' style='display:inline-block;margin-top:6px;padding:6px 12px;background:#3DB551;color:#fff;border-radius:6px;font-weight:600;text-decoration:none;font-size:12px'>Navigate</a> "+(bay.ts?"<button onclick='undoBay("+i+")' style='margin-top:6px;padding:6px 12px;background:#555;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Undo</button>":"<button onclick='openTidy("+i+")' style='margin-top:6px;padding:6px 12px;background:#32D74B;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Tidy</button>");
bayMarks[i]=L.marker([bay.lat,bay.lng],{icon:ic}).addTo(map).bindPopup(pop);
});stats();pace();
}
function refreshBikes(){
bays.forEach(function(b){b.ts=null;b.at=null});save();renderBays();
toast("Loading bikes...");
fetch("/api/bikes").then(function(r){return r.json()}).then(function(d){
bMarks.forEach(function(m){map.removeLayer(m)});bMarks=[];
if(d.bikes){d.bikes.forEach(function(bk){bMarks.push(L.marker([bk.lat,bk.lng],{icon:iB}).addTo(map))})}
document.getElementById("bikeCount").textContent=(d.count||0)+" bikes";
renderBays();toast((d.count||0)+" bikes loaded");
}).catch(function(){document.getElementById("bikeCount").textContent="error"});
}
function nearestBay(){
var u=bays.filter(function(b){return!b.ts});
if(!u.length){toast("All done!");return}
var n=null,m=Infinity;
u.forEach(function(b){var d2=dist(uLat,uLng,b.lat,b.lng);if(d2<m){m=d2;n=b}});
var i=bays.indexOf(n);map.setView([n.lat,n.lng],16);
if(bayMarks[i])bayMarks[i].openPopup();
toast(n.name+" - "+fmtDist(m));
}
function showRoute(){
var active=[];
bays.forEach(function(b,i){if(b.ts)return;var bc=bikesAt(b);if(bc>0)active.push({bay:b,idx:i,bikes:bc,dist:0})});
if(!active.length){toast("No bays with bikes! Hit Refresh");return}
var route=[];var remaining=active.slice();var curLat=uLat,curLng=uLng;
while(remaining.length>0){
var best=-1,bestD=Infinity;
for(var j=0;j<remaining.length;j++){var d2=dist(curLat,curLng,remaining[j].bay.lat,remaining[j].bay.lng);var score=d2-(remaining[j].bikes*20);if(score<bestD){bestD=score;best=j}}
var pick=remaining.splice(best,1)[0];
pick.dist=dist(curLat,curLng,pick.bay.lat,pick.bay.lng);
route.push(pick);curLat=pick.bay.lat;curLng=pick.bay.lng;
}
var totalDist=route.reduce(function(s,r){return s+r.dist},0);
document.getElementById("routeInfo").textContent=route.length+" bays to visit | ~"+fmtDist(totalDist)+" total";
var rhtml=route.map(function(r,idx){
var cm="https://citymapper.com/directions?endcoord="+r.bay.lat+","+r.bay.lng+"&endname="+encodeURIComponent(r.bay.name);
return "<div class='bay-item'><div><div class='bay-name'><span style='color:#FF9F0A;margin-right:6px'>#"+(idx+1)+"</span>"+r.bay.name+"</div><div class='bay-bikes'>"+r.bikes+" bikes</div><div class='bay-dist'>"+fmtDist(r.dist)+(idx===0?" from you":" from #"+idx)+"</div></div><div class='bay-actions'><a href='"+cm+"' target='_blank' style='padding:6px 10px;background:#3DB551;color:#fff;border-radius:8px;text-decoration:none;font-size:11px;font-weight:600'>Go</a></div></div>";
}).join("");
document.getElementById("routeList").innerHTML=rhtml;
oP("routePanel");
}
function openBayPanel(){fB("all")}
function fB(f){
var fl=bays;
if(f==="todo")fl=bays.filter(function(b){return!b.ts});
if(f==="done")fl=bays.filter(function(b){return b.ts});
fl=fl.slice().sort(function(a,b){return bikesAt(b)-bikesAt(a)});
document.getElementById("panelCount").textContent=fl.length;
document.getElementById("bayList").innerHTML=fl.map(function(bay){
var ri=bays.indexOf(bay);var bc=bikesAt(bay);var d2=dist(uLat,uLng,bay.lat,bay.lng);
var bl=bc>0?" - "+bc+" bikes":"";
return "<div class='bay-item "+(bay.ts?"done":"")+"'><div><div class='bay-name'>"+(bay.ts?"\\u2705":"\\ud83d\\udd34")+" "+bay.name+"<span style='color:#32D74B;font-weight:700'>"+bl+"</span></div><div class='bay-dist'>"+fmtDist(d2)+" away</div></div><div class='bay-actions'><button onclick='flyTo("+ri+")' style='background:#0A84FF;color:#fff'>Map</button>"+(bay.ts?"<button onclick='undoBay("+ri+");fB(\\x22"+f+"\\x22)' style='background:#555;color:#fff'>Undo</button>":"<button onclick='openTidy("+ri+");cP(\\x22bayPanel\\x22)' style='background:#32D74B;color:#000'>Tidy</button>")+"</div></div>";
}).join("");
oP("bayPanel");
}
function flyTo(i){cP("bayPanel");map.setView([bays[i].lat,bays[i].lng],16);if(bayMarks[i])bayMarks[i].openPopup()}
renderBays();
setInterval(pace,30000);
`;

// Verify JS syntax
try { new Function(js); } catch(e) { console.log("JS ERROR:", e.message); process.exit(1); }
console.log("JS SYNTAX: OK");

var full = html + js + "\n<\/script>\n<\/body>\n<\/html>";
fs.writeFileSync('index.html', full);
console.log("Written! Size:", full.length, "bytes");
