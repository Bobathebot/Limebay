var fs = require('fs');
var TILE = 'https://tile.openstreetmap.org/' + '{z}/{x}/{y}' + '.png';

var html = [];
html.push('<!DOCTYPE html>');
html.push('<html lang="en"><head>');
html.push('<meta charset="UTF-8">');
html.push('<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">');
html.push('<title>LimeBay</title>');
html.push('<meta name="apple-mobile-web-app-capable" content="yes">');
html.push('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">');
html.push('<meta name="apple-mobile-web-app-title" content="LimeBay">');
html.push('<link rel="stylesheet" href="leaflet.css"/>');
html.push('<script src="leaflet.js"><\/script>');
html.push('<style>');
html.push('*{margin:0;padding:0;box-sizing:border-box}');
html.push('body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#111;color:#fff;overflow:hidden}');
html.push('#map{width:100vw;height:100vh}');
html.push('#topbar{position:fixed;top:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);padding:8px 12px;display:flex;align-items:center;justify-content:space-between}');
html.push('#topbar h1{font-size:16px;color:#32D74B}');
html.push('#topbar .stats{font-size:11px;color:#888;text-align:right}');
html.push('#topbar .stats b{color:#32D74B}');
html.push('.pace{font-size:10px;color:#FF9F0A;margin-top:1px}');
html.push('#zonebar{position:fixed;top:40px;left:0;right:0;z-index:999;background:rgba(0,0,0,.8);padding:5px 12px;display:flex;gap:6px;align-items:center}');
html.push('.zbtn{padding:5px 12px;border:2px solid #555;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;background:transparent;color:#aaa}');
html.push('.zbtn.active{border-color:#32D74B;color:#32D74B;background:rgba(50,212,75,.1)}');
html.push('#controls{position:fixed;bottom:0;left:0;right:0;z-index:1000;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);padding:7px 10px;padding-bottom:max(7px,env(safe-area-inset-bottom))}');
html.push('#controls .row{display:flex;gap:5px;margin-bottom:5px}#controls .row:last-child{margin-bottom:0}');
html.push('.btn{flex:1;padding:10px 4px;border:none;border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;text-align:center}.btn:active{opacity:.7}');
html.push('.bg{background:#32D74B;color:#000}.br{background:#FF453A;color:#fff}.bb{background:#0A84FF;color:#fff}.bo{background:#FF9F0A;color:#000}.bk{background:#333;color:#fff}.bp{background:#BF5AF2;color:#fff}');
html.push('#bikeCount{position:fixed;top:68px;right:10px;z-index:998;background:#32D74B;color:#000;padding:4px 10px;border-radius:14px;font-size:11px;font-weight:700}');
html.push('#toast{display:none;position:fixed;top:95px;left:50%;transform:translateX(-50%);z-index:3000;background:rgba(50,212,75,.95);color:#000;padding:8px 18px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap}');
html.push('.panel{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:2000;background:rgba(0,0,0,.96);padding:16px;overflow-y:auto}');
html.push('.panel h2{color:#32D74B;margin-bottom:12px}');
html.push('.bay-item{background:#1c1c1e;border-radius:12px;padding:11px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center}');
html.push('.bay-item.done{opacity:.45}.bay-item.urgent{border:2px solid #FF453A}');
html.push('.bay-name{font-size:13px;font-weight:600}.bay-dist{color:#888;font-size:11px;margin-top:2px}');
html.push('.bay-actions{display:flex;gap:4px}.bay-actions button,.bay-actions a{padding:5px 9px;border:none;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}');
html.push('.close-btn{position:fixed;top:14px;right:14px;z-index:2001;background:#FF453A;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer}');
html.push('.popup{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2500;background:#1c1c1e;padding:20px;border-radius:16px;text-align:center;min-width:280px;max-width:90vw}');
html.push('.popup button{display:block;width:250px;margin:6px auto;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}');
html.push('.popup textarea{width:250px;height:60px;padding:10px;border:1px solid #333;border-radius:8px;background:#111;color:#fff;font-size:14px;resize:none;margin-top:8px}');
html.push('#camWrap{position:relative;width:280px;margin:0 auto;border-radius:10px;overflow:hidden}');
html.push('#camVideo{width:280px;display:block;background:#000}');
html.push('#camOvr{position:absolute;top:0;right:0;padding:10px 12px;text-align:right}');
html.push('#camPreview{width:280px;border-radius:10px;display:none;margin:8px auto 0}');
html.push('.cluster-badge{font-size:10px;color:#FF9F0A;font-weight:700;margin-left:4px}');
html.push('</style></head><body>');

// Topbar
html.push('<div id="topbar"><h1>LimeBay</h1><div class="stats">Bays: <b id="totalBays">0</b> | Done: <b id="doneBays">0</b> | Left: <b id="leftBays">0</b><div class="pace" id="paceDisplay"></div></div></div>');
html.push('<div id="zonebar"><button class="zbtn active" id="zBre" onclick="switchZone(\'bre1\')">BRE1</button><button class="zbtn" id="zWm" onclick="switchZone(\'wm\')">WM5+17</button></div>');
html.push('<div id="bikeCount">0 bikes</div>');
html.push('<div id="toast"></div>');
html.push('<div id="map"></div>');

// Popups
html.push("<div class=\"popup\" id=\"tidyPopup\"><div style=\"font-size:17px;font-weight:700;color:#32D74B;margin-bottom:4px\" id=\"tidyTitle\"></div><div style=\"color:#888;font-size:12px;margin-bottom:12px\" id=\"tidyLabel\"></div><button style=\"background:#32D74B;color:#000\" onclick=\"confirmTidy('tidy')\">Tidy</button><button style=\"background:#0A84FF;color:#fff\" onclick=\"confirmTidy('tidied')\">Tidied</button><button style=\"background:#333;color:#fff\" onclick=\"cP('tidyPopup')\">Cancel</button></div>");
html.push("<div class=\"popup\" id=\"copyPopup\"><div style=\"font-size:14px;font-weight:600;color:#32D74B;margin-bottom:4px\">Tap text then Copy</div><textarea id=\"copyText\" readonly></textarea><button style=\"background:#333;color:#fff\" onclick=\"cP('copyPopup')\">Done</button></div>");

// Camera
html.push('<div class="popup" id="camPopup" style="min-width:300px">');
html.push('<div style="font-size:15px;font-weight:700;color:#32D74B;margin-bottom:8px" id="camTitle">Photo</div>');
html.push('<div id="camWrap"><video id="camVideo" autoplay playsinline></video>');
html.push('<div id="camOvr"><div id="oTime" style="color:#fff;font-size:12px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">--</div><div id="oAddr" style="color:#fff;font-size:10px;line-height:1.5;margin-top:2px;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">Detecting...</div><div id="oCoord" style="color:#fff;font-size:9px;margin-top:2px;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.7)">--</div></div></div>');
html.push('<canvas id="camCanvas" style="display:none"></canvas><img id="camPreview">');
html.push('<div id="camCount" style="color:#FF9F0A;font-size:12px;font-weight:600;margin-top:4px"></div>');
html.push("<div id=\"camBtns1\"><button style=\"background:#32D74B;color:#000\" onclick=\"snapPhoto()\">Snap Before</button><button style=\"background:#333;color:#fff\" onclick=\"closeCam()\">Cancel</button></div>");
html.push("<div id=\"camBtns2\" style=\"display:none\"><button style=\"background:#FF9F0A;color:#000\" onclick=\"snapAfter()\">Snap After</button><button style=\"background:#3DB551;color:#fff\" onclick=\"shareAll()\">Share to Slack</button><button style=\"background:#0A84FF;color:#fff\" onclick=\"saveAll()\">Save Photos</button><button style=\"background:#333;color:#fff\" onclick=\"closeCam()\">Done</button></div>");
html.push('</div>');

// Panels
html.push("<div class=\"panel\" id=\"routePanel\"><button class=\"close-btn\" onclick=\"cP('routePanel')\">X</button><h2>Route Plan</h2><div style=\"color:#888;font-size:12px;margin-bottom:12px\" id=\"routeInfo\"></div><div id=\"routeList\"></div></div>");
html.push("<div class=\"panel\" id=\"bayPanel\"><button class=\"close-btn\" onclick=\"cP('bayPanel')\">X</button><h2>All Bays (<span id=\"panelCount\"></span>)</h2><div style=\"margin-bottom:10px;display:flex;gap:6px\"><button class=\"btn bg\" style=\"padding:7px\" onclick=\"fB('all')\">All</button><button class=\"btn bo\" style=\"padding:7px\" onclick=\"fB('todo')\">To Tidy</button><button class=\"btn bk\" style=\"padding:7px\" onclick=\"fB('done')\">Done</button></div><div id=\"bayList\"></div></div>");
html.push("<div class=\"panel\" id=\"histPanel\"><button class=\"close-btn\" onclick=\"cP('histPanel')\">X</button><h2>Shift History</h2><div id=\"histList\"></div></div>");

// Controls - 3 rows
html.push('<div id="controls">');
html.push('<div class="row"><button class="btn bg" onclick="refreshOnly()">Refresh Bikes</button><button class="btn bb" onclick="centerMe()">My Location</button><button class="btn bo" onclick="nearestBay()">Nearest</button></div>');
html.push('<div class="row"><button class="btn bp" onclick="showRoute()">Route Plan</button><button class="btn bk" onclick="openBayPanel()">Bays</button><button class="btn bk" onclick="showHistory()">History</button></div>');
html.push('<div class="row"><button class="btn br" onclick="resetBays()">Reset Bays</button><button class="btn bk" onclick="endShift()">End Shift</button></div>');
html.push('</div>');

html.push('<script>');

// Build JS
var js = 'var TILE_URL="' + TILE + '";\n';

// All zone data
js += 'var ZONES_DATA={\n';
js += 'bre1:{center:[51.5385,-0.2150],zoom:14,radius:25,maxCap:10,\n';
js += 'poly:' + JSON.stringify([
  [51.5524661,-0.2571598],[51.5517801,-0.2608551],[51.5483151,-0.2631213],
  [51.5463647,-0.2685598],[51.5437780,-0.2730777],[51.5399374,-0.2775980],
  [51.5387313,-0.2813762],[51.5358572,-0.2779626],[51.5321862,-0.2644704],
  [51.5327452,-0.2643914],[51.5348561,-0.2602138],[51.5330767,-0.2538842],
  [51.5296053,-0.2495372],[51.5333164,-0.2462095],[51.5323539,-0.2429441],
  [51.5331569,-0.2343919],[51.5314549,-0.2304148],[51.5307439,-0.2272698],
  [51.5305549,-0.2235347],[51.5285089,-0.2157287],[51.5297629,-0.2157477],
  [51.5304819,-0.2150217],[51.5319439,-0.2149877],[51.5334390,-0.2035490],
  [51.5309889,-0.1978634],[51.5283487,-0.1980617],[51.5277080,-0.1966884],
  [51.5334839,-0.1920883],[51.5345389,-0.1927233],[51.5368809,-0.1911753],
  [51.5505629,-0.2066466],[51.5464469,-0.2214934],[51.5436179,-0.2389171],
  [51.5503432,-0.2548816],[51.5524661,-0.2571598]
]) + ',\n';
js += 'bays:[' + [
  '{n:"Hazel Road",a:51.530683,o:-0.225716}','{n:"Station Terrace",a:51.53447,o:-0.219888}',
  '{n:"Wrentham Avenue",a:51.53544,o:-0.219793}','{n:"Harvist Road (East)",a:51.534525,o:-0.205179}',
  '{n:"The Avenue (South)",a:51.540984,o:-0.211256}','{n:"Cambridge Avenue",a:51.535224,o:-0.193328}',
  '{n:"Coventry Close",a:51.536771,o:-0.192748}','{n:"Dyne Road",a:51.544532,o:-0.20154}',
  '{n:"Keslake Road",a:51.533594,o:-0.218408}','{n:"Kingswood Avenue",a:51.535821,o:-0.208776}',
  '{n:"Harvist Road (West)",a:51.533963,o:-0.209008}','{n:"Waxlow Road",a:51.534911,o:-0.260676}',
  '{n:"Mordaunt Road",a:51.537061,o:-0.257652}','{n:"Harlesden Road",a:51.540786,o:-0.23797}',
  '{n:"Donnington Road (East)",a:51.54131,o:-0.227971}','{n:"Exeter Road",a:51.547192,o:-0.204983}',
  '{n:"Christchurch Avenue (North)",a:51.546715,o:-0.204368}','{n:"Oakhampton Road",a:51.537403,o:-0.22172}',
  '{n:"Uffington Road",a:51.541689,o:-0.232816}','{n:"College Road (South)",a:51.535404,o:-0.226326}',
  '{n:"Charteris Road",a:51.538595,o:-0.199107}','{n:"Sidmouth Road",a:51.544842,o:-0.221877}',
  '{n:"Malvern Road",a:51.528137,o:-0.197343}','{n:"Bathurst Gardens",a:51.533722,o:-0.22629}',
  '{n:"Priory Park Road",a:51.540393,o:-0.196685}','{n:"Torbay Road",a:51.54098,o:-0.202733}',
  '{n:"Harvist Road (Mid)",a:51.533885,o:-0.209169}','{n:"Aylestone Avenue 1",a:51.54467,o:-0.217687}',
  '{n:"Tiverton Road",a:51.537804,o:-0.216182}','{n:"Christchurch Avenue (South)",a:51.540288,o:-0.214513}',
  '{n:"The Avenue (North)",a:51.542315,o:-0.209502}','{n:"Coverdale Road",a:51.545115,o:-0.213214}',
  '{n:"Brondesbury Villas",a:51.537675,o:-0.19362}','{n:"Victoria Road 1",a:51.535331,o:-0.204989}',
  '{n:"St Julians Road",a:51.541268,o:-0.199203}','{n:"Cambridge Road",a:51.532297,o:-0.194179}',
  '{n:"Victoria Road 2",a:51.538751,o:-0.197543}','{n:"Aylestone Avenue 2",a:51.542987,o:-0.218791}',
  '{n:"College Road (Mid)",a:51.53374,o:-0.22561}','{n:"College Road (North)",a:51.533638,o:-0.225675}'
].join(',') + ']},\n';

js += 'wm:{center:[51.5220,-0.1570],zoom:15,radius:20,maxCap:6,\n';
js += 'poly:' + JSON.stringify([
  [51.521045,-0.163668],[51.514396,-0.160664],[51.516891,-0.145998],[51.523366,-0.148938],
  [51.523340,-0.149110],[51.523140,-0.150869],[51.522926,-0.152929],[51.522218,-0.156792],
  [51.521045,-0.163668],
  [51.520967,-0.164288],[51.522926,-0.152929],[51.523366,-0.148938],[51.523977,-0.145201],
  [51.525267,-0.145764],[51.525035,-0.147124],[51.524893,-0.148421],[51.523971,-0.153914],
  [51.523718,-0.155630],[51.524278,-0.157283],[51.524839,-0.158592],[51.526414,-0.159879],
  [51.526895,-0.160716],[51.528751,-0.163656],[51.528657,-0.163892],[51.528337,-0.165479],
  [51.528617,-0.165909],[51.530433,-0.168140],[51.529632,-0.169986],[51.527709,-0.174170],
  [51.527122,-0.173419],[51.525400,-0.169621],[51.524759,-0.168269],[51.523718,-0.166928],
  [51.522963,-0.165887],[51.522436,-0.165276],[51.520967,-0.164288]
]) + ',\n';
js += 'bays:[' + [
  '{n:"Rossmore Road",a:51.52525,o:-0.163881}','{n:"Allsop Pl",a:51.523806,o:-0.157472}',
  '{n:"Taunton Pl",a:51.525528,o:-0.161472}','{n:"Great Central St",a:51.522222,o:-0.162278}',
  '{n:"Baker St (WM17)",a:51.524083,o:-0.158278}','{n:"Herewood Ave",a:51.523139,o:-0.164667}',
  '{n:"Baker Street (N)",a:51.521278,o:-0.1572}','{n:"Weymouth Street",a:51.520407,o:-0.149001}',
  '{n:"Rodmarton St (N)",a:51.518993,o:-0.157625}','{n:"Rodmarton St (S)",a:51.518157,o:-0.157222}',
  '{n:"Blandford St",a:51.518117,o:-0.156057}','{n:"Baker Street (S)",a:51.518729,o:-0.15604}',
  '{n:"Thayer St",a:51.517056,o:-0.151306}','{n:"Manchester Square 2",a:51.516652,o:-0.153165}',
  '{n:"Portman Square",a:51.516222,o:-0.155722}','{n:"Nottingham St",a:51.521278,o:-0.153917}',
  '{n:"Bryanston Square",a:51.518444,o:-0.161556}','{n:"Manchester Square 1",a:51.516582,o:-0.152073}',
  '{n:"George Street",a:51.517983,o:-0.152007}','{n:"New Cavendish St",a:51.518712,o:-0.151182}',
  '{n:"Montagu Street",a:51.516681,o:-0.158939}'
].join(',') + ']}\n};\n';

js += `
var STORAGE="limebay_v12";var SHIFT_KEY="limebay_shift5";var ZONE_KEY="limebay_zone";var HIST_KEY="limebay_hist";
var curZone=localStorage.getItem(ZONE_KEY)||"bre1";
var zData=ZONES_DATA[curZone];
var map,uMark,bMarks=[],bayMarks={},bays,bayCircle=null,zonePoly=null,routeLine=null;
var uLat=zData.center[0],uLng=zData.center[1];
var ss=localStorage.getItem(SHIFT_KEY)?parseInt(localStorage.getItem(SHIFT_KEY)):null;
var pendTidy=null;

function loadBays(){bays=JSON.parse(localStorage.getItem(STORAGE+"_"+curZone)||"null");if(!bays){bays=zData.bays.map(function(b){return{name:b.n,lat:b.a,lng:b.o,red:true,ts:null,at:null}});localStorage.setItem(STORAGE+"_"+curZone,JSON.stringify(bays))}}
loadBays();

map=L.map("map",{zoomControl:false}).setView(zData.center,zData.zoom);
L.tileLayer(TILE_URL,{attribution:"OSM",maxZoom:19}).addTo(map);

function mkI(e,s){return L.divIcon({html:"<div style='font-size:"+s+"px;text-align:center;line-height:1'>"+e+"</div>",className:"",iconSize:[s,s],iconAnchor:[s/2,s/2]})}
var iB=mkI("\\ud83d\\udfe2",16),iR=mkI("\\ud83d\\udd34",24),iT=mkI("\\ud83e\\uddf9",24),iD=mkI("\\u2705",24),iU=mkI("\\ud83d\\udfe5",22);

function toast(m){var t=document.getElementById("toast");t.textContent=m;t.style.display="block";setTimeout(function(){t.style.display="none"},2500)}
function oP(id){document.getElementById(id).style.display="block"}
function cP(id){document.getElementById(id).style.display="none"}
function dist(a,b,c,d){var R=6371000,dL=(c-a)*Math.PI/180,dN=(d-b)*Math.PI/180;var x=Math.sin(dL/2)*Math.sin(dL/2)+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dN/2)*Math.sin(dN/2);return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))}
function fmtDist(m){return m<1000?Math.round(m)+"m":(m/1000).toFixed(1)+"km"}
function bikesAt(bay){var c=0;bMarks.forEach(function(m){var l=m.getLatLng();if(dist(bay.lat,bay.lng,l.lat,l.lng)<=zData.radius)c++});return c}

if(navigator.geolocation){navigator.geolocation.watchPosition(function(p){uLat=p.coords.latitude;uLng=p.coords.longitude;if(uMark)uMark.setLatLng([uLat,uLng]);else uMark=L.marker([uLat,uLng],{icon:iU}).addTo(map)},null,{enableHighAccuracy:true})}
function centerMe(){map.setView([uLat,uLng],16)}

function save(){localStorage.setItem(STORAGE+"_"+curZone,JSON.stringify(bays));stats();pace()}
function stats(){var t=bays.length,d=bays.filter(function(b){return b.ts}).length;document.getElementById("totalBays").textContent=t;document.getElementById("doneBays").textContent=d;document.getElementById("leftBays").textContent=t-d}
function pace(){if(!ss){document.getElementById("paceDisplay").textContent="";return}var d=bays.filter(function(b){return b.ts}).length;if(!d)return;var h=(Date.now()-ss)/3600000;if(h<.01)return;var bph=(d/h).toFixed(1);var col=bph>=6?"#32D74B":bph>=4?"#FF9F0A":"#FF453A";document.getElementById("paceDisplay").innerHTML="<span style='color:"+col+"'>"+bph+" bph</span>"}

// ===== ZONE SWITCHING =====
function switchZone(z){curZone=z;zData=ZONES_DATA[z];localStorage.setItem(ZONE_KEY,z);document.getElementById("zBre").className=z==="bre1"?"zbtn active":"zbtn";document.getElementById("zWm").className=z==="wm"?"zbtn active":"zbtn";loadBays();clearMap();drawBoundary();map.setView(zData.center,zData.zoom);renderBays();toast(z==="bre1"?"Brent Zone":"Westminster Zone")}
function clearMap(){bMarks.forEach(function(m){map.removeLayer(m)});bMarks=[];Object.keys(bayMarks).forEach(function(k){map.removeLayer(bayMarks[k])});bayMarks={};if(bayCircle){map.removeLayer(bayCircle);bayCircle=null}if(zonePoly){map.removeLayer(zonePoly);zonePoly=null}if(routeLine){map.removeLayer(routeLine);routeLine=null}}
function drawBoundary(){if(zonePoly){map.removeLayer(zonePoly);zonePoly=null}if(zData.poly&&zData.poly.length>0){zonePoly=L.polygon(zData.poly,{color:"#FF453A",fillColor:"#FF453A",fillOpacity:0.06,weight:2,opacity:0.4,dashArray:"6 4"}).addTo(map)}}

// ===== TIDY =====
function openTidy(i){pendTidy=i;document.getElementById("tidyTitle").textContent=bays[i].name;document.getElementById("tidyLabel").textContent=bays[i].red?"Red star bay":"Bay";oP("tidyPopup")}
function confirmTidy(s){if(pendTidy===null)return;if(!ss){ss=Date.now();localStorage.setItem(SHIFT_KEY,ss)}var b=bays[pendTidy];b.ts=s;b.at=Date.now();var label=b.red?" red star":"";var msg=b.name+label+"\\n"+s;var ta=document.getElementById("copyText");ta.value=msg;oP("copyPopup");ta.focus();ta.select();toast(b.name+" - "+s);save();renderBays();cP("tidyPopup");pendTidy=null}
function undoBay(i){bays[i].ts=null;bays[i].at=null;save();renderBays();toast(bays[i].name+" reset")}

// ===== RENDER BAYS WITH OVERCAPACITY ALERTS =====
function renderBays(){
  Object.keys(bayMarks).forEach(function(k){map.removeLayer(bayMarks[k])});bayMarks={};
  bays.forEach(function(bay,i){
    var ic=iR;if(bay.ts==="tidy")ic=iT;if(bay.ts==="tidied")ic=iD;
    var bc=bikesAt(bay);
    var overCap=bc>zData.maxCap;
    if(overCap&&!bay.ts)ic=mkI("\\ud83d\\udea8",28);
    var cm="https://citymapper.com/directions?endcoord="+bay.lat+","+bay.lng+"&endname="+encodeURIComponent(bay.name);
    var bikeInfo=bc>0?"<span style='color:"+(overCap?"#FF453A":"#32D74B")+";font-weight:700'>"+bc+" bikes"+(overCap?" OVER CAPACITY":"")+"</span><br>":"";
    var pop="<b>"+bay.name+"</b>"+(bay.red?" <span style='color:#FF453A'>RED</span>":"")+"<br>"+bikeInfo+(bay.ts?(bay.ts==="tidy"?"Tidy":"Tidied"):"Not done")+(bay.at?"<br><span style='color:#888;font-size:11px'>"+new Date(bay.at).toLocaleTimeString()+"</span>":"")+"<br><a href='"+cm+"' target='_blank' style='display:inline-block;margin-top:6px;padding:6px 12px;background:#3DB551;color:#fff;border-radius:6px;font-weight:600;text-decoration:none;font-size:12px'>Navigate</a> <button onclick='openCam("+i+")' style='margin-top:6px;padding:6px 12px;background:#FF9F0A;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Photo</button> "+(bay.ts?"<button onclick='undoBay("+i+")' style='margin-top:6px;padding:6px 12px;background:#555;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Undo</button>":"<button onclick='openTidy("+i+")' style='margin-top:6px;padding:6px 12px;background:#32D74B;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px'>Tidy</button>");
    var mk=L.marker([bay.lat,bay.lng],{icon:ic}).addTo(map).bindPopup(pop);
    mk.on("popupopen",function(){if(bayCircle)map.removeLayer(bayCircle);bayCircle=L.circle([bay.lat,bay.lng],{radius:zData.radius,color:"#0A84FF",fillColor:"#0A84FF",fillOpacity:0.15,weight:2,opacity:0.5}).addTo(map)});
    mk.on("popupclose",function(){if(bayCircle){map.removeLayer(bayCircle);bayCircle=null}});
    bayMarks[i]=mk;
  });stats();pace();
}

// ===== REFRESH BIKES (no reset) =====
function refreshOnly(){
  toast("Loading bikes...");
  fetch("/api/bikes?zone="+curZone).then(function(r){return r.json()}).then(function(d){
    bMarks.forEach(function(m){map.removeLayer(m)});bMarks=[];
    if(d.bikes){d.bikes.forEach(function(bk){bMarks.push(L.marker([bk.lat,bk.lng],{icon:iB}).addTo(map))})}
    document.getElementById("bikeCount").textContent=(d.count||0)+" bikes";
    renderBays();toast((d.count||0)+" bikes loaded");
  }).catch(function(){document.getElementById("bikeCount").textContent="error"});
}

// ===== RESET BAYS =====
function resetBays(){if(!confirm("Reset all bays?"))return;bays.forEach(function(b){b.ts=null;b.at=null});ss=null;localStorage.removeItem(SHIFT_KEY);save();renderBays();toast("Bays reset")}

// ===== NEAREST BAY =====
function nearestBay(){
  var u=bays.filter(function(b){return!b.ts});if(!u.length){toast("All done!");return}
  var n=null,m=Infinity;u.forEach(function(b){var d2=dist(uLat,uLng,b.lat,b.lng);if(d2<m){m=d2;n=b}});
  var i=bays.indexOf(n);map.setView([n.lat,n.lng],16);if(bayMarks[i])bayMarks[i].openPopup();toast(n.name+" - "+fmtDist(m));
}

// ===== CLUSTER-FIRST ROUTE ALGORITHM =====
function buildClusters(items,clusterDist){
  var clusters=[];var used={};
  items.forEach(function(item,i){
    if(used[i])return;
    var cluster=[item];used[i]=true;
    items.forEach(function(other,j){
      if(used[j])return;
      if(dist(item.bay.lat,item.bay.lng,other.bay.lat,other.bay.lng)<=clusterDist){cluster.push(other);used[j]=true}
    });
    var cLat=cluster.reduce(function(s,c){return s+c.bay.lat},0)/cluster.length;
    var cLng=cluster.reduce(function(s,c){return s+c.bay.lng},0)/cluster.length;
    clusters.push({items:cluster,lat:cLat,lng:cLng,totalBikes:cluster.reduce(function(s,c){return s+c.bikes},0)});
  });
  return clusters;
}

function routeCluster(items,startLat,startLng){
  var route=[];var rem=items.slice();var cLat=startLat,cLng=startLng;
  while(rem.length>0){
    var best=-1,bestD=Infinity;
    for(var j=0;j<rem.length;j++){var d2=dist(cLat,cLng,rem[j].bay.lat,rem[j].bay.lng);if(d2<bestD){bestD=d2;best=j}}
    var pick=rem.splice(best,1)[0];pick.dist=dist(cLat,cLng,pick.bay.lat,pick.bay.lng);
    route.push(pick);cLat=pick.bay.lat;cLng=pick.bay.lng;
  }
  return route;
}

function twoOpt(route){
  var improved=true;
  while(improved){
    improved=false;
    for(var i=1;i<route.length-1;i++){
      for(var j=i+1;j<route.length;j++){
        var before=routeDist(route);
        var seg=route.slice(i,j+1).reverse();
        var newRoute=route.slice(0,i).concat(seg).concat(route.slice(j+1));
        recalcDists(newRoute);
        if(routeDist(newRoute)<before){route=newRoute;improved=true}
      }
    }
  }
  return route;
}

function routeDist(r){return r.reduce(function(s,x){return s+x.dist},0)}
function recalcDists(r){
  var pLat=uLat,pLng=uLng;
  for(var i=0;i<r.length;i++){r[i].dist=dist(pLat,pLng,r[i].bay.lat,r[i].bay.lng);pLat=r[i].bay.lat;pLng=r[i].bay.lng}
}

function showRoute(){
  var active=[];
  bays.forEach(function(b,i){if(b.ts)return;var bc=bikesAt(b);if(bc>0)active.push({bay:b,idx:i,bikes:bc,dist:0,overCap:bc>zData.maxCap})});
  if(!active.length){toast("No bays with bikes! Hit Refresh");return}

  // Step 1: Build clusters (bays within 200m of each other)
  var clusters=buildClusters(active,200);

  // Step 2: Order clusters by nearest-neighbour from user, prioritise overcapacity
  var orderedClusters=[];var remC=clusters.slice();var cLat=uLat,cLng=uLng;
  while(remC.length>0){
    var best=-1,bestS=Infinity;
    for(var k=0;k<remC.length;k++){
      var d2=dist(cLat,cLng,remC[k].lat,remC[k].lng);
      var bonus=remC[k].items.some(function(x){return x.overCap})?-500:0;
      var score=d2-(remC[k].totalBikes*15)+bonus;
      if(score<bestS){bestS=score;best=k}
    }
    var pick=remC.splice(best,1)[0];orderedClusters.push(pick);cLat=pick.lat;cLng=pick.lng;
  }

  // Step 3: Within each cluster, route by nearest-neighbour
  var fullRoute=[];var rLat=uLat,rLng=uLng;
  orderedClusters.forEach(function(cl){
    var clRoute=routeCluster(cl.items,rLat,rLng);
    fullRoute=fullRoute.concat(clRoute);
    if(clRoute.length>0){var last=clRoute[clRoute.length-1];rLat=last.bay.lat;rLng=last.bay.lng}
  });

  // Step 4: 2-opt improvement (only if <30 bays to keep it fast)
  if(fullRoute.length<=30){recalcDists(fullRoute);fullRoute=twoOpt(fullRoute)}
  recalcDists(fullRoute);

  var totalDist=routeDist(fullRoute);
  var overCount=fullRoute.filter(function(r){return r.overCap}).length;
  document.getElementById("routeInfo").innerHTML=fullRoute.length+" bays | ~"+fmtDist(totalDist)+" total"+(overCount?"<br><span style='color:#FF453A;font-weight:700'>"+overCount+" OVERCAPACITY bay(s)!</span>":"");

  var rhtml=fullRoute.map(function(r,idx){
    var cm="https://citymapper.com/directions?endcoord="+r.bay.lat+","+r.bay.lng+"&endname="+encodeURIComponent(r.bay.name);
    var urgent=r.overCap?" urgent":"";
    return "<div class='bay-item"+urgent+"'><div><div class='bay-name'><span style='color:#FF9F0A;margin-right:6px'>#"+(idx+1)+"</span>"+r.bay.name+"</div><div style='color:"+(r.overCap?"#FF453A":"#32D74B")+";font-size:12px;font-weight:700'>"+r.bikes+" bikes"+(r.overCap?" \\ud83d\\udea8":"")+"</div><div class='bay-dist'>"+fmtDist(r.dist)+(idx===0?" from you":" from #"+idx)+"</div></div><div class='bay-actions'><a href='"+cm+"' target='_blank' style='background:#3DB551;color:#fff'>Go</a></div></div>";
  }).join("");
  document.getElementById("routeList").innerHTML=rhtml;
  if(routeLine){map.removeLayer(routeLine);routeLine=null}
  var coords=[[uLat,uLng]];fullRoute.forEach(function(r){coords.push([r.bay.lat,r.bay.lng])});
  routeLine=L.polyline(coords,{color:"#BF5AF2",weight:3,opacity:0.6,dashArray:"8 6"}).addTo(map);
  oP("routePanel");
}

// ===== BAY PANEL =====
function openBayPanel(){fB("all")}
function fB(f){
  var fl=bays;if(f==="todo")fl=bays.filter(function(b){return!b.ts});if(f==="done")fl=bays.filter(function(b){return b.ts});
  fl=fl.slice().sort(function(a,b){return bikesAt(b)-bikesAt(a)});
  document.getElementById("panelCount").textContent=fl.length;
  document.getElementById("bayList").innerHTML=fl.map(function(bay){
    var ri=bays.indexOf(bay);var bc=bikesAt(bay);var d2=dist(uLat,uLng,bay.lat,bay.lng);
    var bl=bc>0?" - "+bc+" bikes":"";var overCap=bc>zData.maxCap;
    return "<div class='bay-item "+(bay.ts?"done":"")+(overCap?" urgent":"")+"'><div><div class='bay-name'>"+(bay.ts?"\\u2705":"\\ud83d\\udd34")+" "+bay.name+"<span style='color:"+(overCap?"#FF453A":"#32D74B")+";font-weight:700'>"+bl+(overCap?" \\ud83d\\udea8":"")+"</span></div><div class='bay-dist'>"+fmtDist(d2)+" away</div></div><div class='bay-actions'><button onclick='flyTo("+ri+")' style='background:#0A84FF;color:#fff'>Map</button>"+(bay.ts?"<button onclick='undoBay("+ri+");fB(\\x22"+f+"\\x22)' style='background:#555;color:#fff'>Undo</button>":"<button onclick='openTidy("+ri+");cP(\\x22bayPanel\\x22)' style='background:#32D74B;color:#000'>Tidy</button>")+"</div></div>";
  }).join("");
  oP("bayPanel");
}
function flyTo(i){cP("bayPanel");map.setView([bays[i].lat,bays[i].lng],16);if(bayMarks[i])bayMarks[i].openPopup()}

// ===== SHIFT HISTORY =====
function endShift(){
  var done=bays.filter(function(b){return b.ts}).length;
  if(!done){toast("No bays done yet");return}
  if(!confirm("End shift and save to history?"))return;
  var h=(Date.now()-(ss||Date.now()))/3600000;
  var bph=h>0.01?(done/h).toFixed(1):"0";
  var entry={date:new Date().toLocaleDateString("en-GB"),zone:curZone==="bre1"?"BRE1":"WM5+17",done:done,total:bays.length,hours:h.toFixed(1),bph:bph,bays:bays.filter(function(b){return b.ts}).map(function(b){return b.name+" ("+b.ts+" "+new Date(b.at).toLocaleTimeString()+")"})};
  var hist=JSON.parse(localStorage.getItem(HIST_KEY)||"[]");
  hist.unshift(entry);if(hist.length>50)hist=hist.slice(0,50);
  localStorage.setItem(HIST_KEY,JSON.stringify(hist));
  resetBaysQuiet();toast("Shift saved! "+done+" bays, "+bph+" bph");
}
function resetBaysQuiet(){bays.forEach(function(b){b.ts=null;b.at=null});ss=null;localStorage.removeItem(SHIFT_KEY);save();renderBays()}
function showHistory(){
  var hist=JSON.parse(localStorage.getItem(HIST_KEY)||"[]");
  if(!hist.length){toast("No shift history yet");return}
  document.getElementById("histList").innerHTML=hist.map(function(h){
    var col=parseFloat(h.bph)>=6?"#32D74B":parseFloat(h.bph)>=4?"#FF9F0A":"#FF453A";
    return "<div class='bay-item'><div><div class='bay-name'>"+h.date+" - "+h.zone+"</div><div class='bay-dist'>"+h.done+"/"+h.total+" bays | "+h.hours+"hrs | <span style='color:"+col+";font-weight:700'>"+h.bph+" bph</span></div></div></div>";
  }).join("");
  oP("histPanel");
}

// ===== CAMERA =====
var camS=null,camI=null,camIdx=null,camBlob=null,camPhotos=[],camAddrL=[],camLt=0,camLn=0;
function openCam(idx){camIdx=idx;camPhotos=[];camBlob=null;camAddrL=[];document.getElementById("camTitle").textContent=bays[idx].name;document.getElementById("camPreview").style.display="none";document.getElementById("camBtns2").style.display="none";document.getElementById("camBtns1").style.display="block";document.getElementById("camCount").textContent="";var btn=document.querySelector("#camBtns1 button");btn.textContent="Snap Before";btn.style.background="#32D74B";oP("camPopup");startCam()}
function startCam(){document.getElementById("camVideo").style.display="block";document.getElementById("camOvr").style.display="block";camLt=uLat;camLn=uLng;navigator.geolocation.getCurrentPosition(function(p){camLt=p.coords.latitude;camLn=p.coords.longitude;document.getElementById("oCoord").textContent=camLt.toFixed(5)+"N  "+Math.abs(camLn).toFixed(5)+"W";fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat="+camLt+"&lon="+camLn+"&zoom=18").then(function(r){return r.json()}).then(function(data){if(data.address){var a=data.address;var st=(a.house_number||"")+(a.house_number?" ":"")+(a.road||"");camAddrL=[st,a.city||a.town||a.suburb||"London",a.state||a.county||"England",a.postcode||"",a.country||"United Kingdom"].filter(function(x){return x});document.getElementById("oAddr").innerHTML=camAddrL.join("<br>")}}).catch(function(){camAddrL=[bays[camIdx].name];document.getElementById("oAddr").textContent=bays[camIdx].name})},function(){camAddrL=[bays[camIdx].name]},{enableHighAccuracy:true});camI=setInterval(function(){var now=new Date();var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];var d=now.getDate();document.getElementById("oTime").textContent=d+" "+M[now.getMonth()]+" "+now.getFullYear()+" at "+now.toLocaleTimeString("en-GB")},500);navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1440}},audio:false}).then(function(s){camS=s;document.getElementById("camVideo").srcObject=s}).catch(function(e){document.getElementById("camTitle").textContent="Camera: "+e.message})}
function stopCam(){if(camS){camS.getTracks().forEach(function(t){t.stop()});camS=null}if(camI){clearInterval(camI);camI=null}}
function snapPhoto(){var v=document.getElementById("camVideo");var cv=document.getElementById("camCanvas");var ctx=cv.getContext("2d");cv.width=v.videoWidth||1920;cv.height=v.videoHeight||1440;ctx.drawImage(v,0,0);stopCam();v.style.display="none";document.getElementById("camOvr").style.display="none";var now=new Date();var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];var d=now.getDate();var dateLine=d+" "+M[now.getMonth()]+" "+now.getFullYear()+" at "+now.toLocaleTimeString("en-GB");var lines=[dateLine].concat(camAddrL);var fs2=Math.round(cv.width*0.026);var pad=fs2*0.8;var lh=fs2*1.45;var by=pad;ctx.textAlign="right";for(var li=0;li<lines.length;li++){ctx.font=fs2+"px -apple-system,Helvetica,sans-serif";ctx.fillStyle="#FFFFFF";ctx.shadowColor="rgba(0,0,0,.9)";ctx.shadowBlur=5;ctx.shadowOffsetX=1;ctx.shadowOffsetY=1;ctx.fillText(lines[li],cv.width-pad,by+pad+lh*(li+0.75))}ctx.shadowBlur=0;ctx.textAlign="left";cv.toBlob(function(blob){camBlob=blob;document.getElementById("camPreview").src=URL.createObjectURL(blob);document.getElementById("camPreview").style.display="block";document.getElementById("camBtns1").style.display="none";document.getElementById("camBtns2").style.display="block";document.getElementById("camCount").textContent=(camPhotos.length+1)+" photo(s)"},"image/jpeg",0.88)}
function snapAfter(){if(camBlob)camPhotos.push(camBlob);camBlob=null;document.getElementById("camPreview").style.display="none";document.getElementById("camBtns2").style.display="none";document.getElementById("camBtns1").style.display="block";var btn=document.querySelector("#camBtns1 button");btn.textContent="Snap After";btn.style.background="#0A84FF";startCam()}
function shareAll(){if(camBlob)camPhotos.push(camBlob);if(!camPhotos.length)return;var bay=bays[camIdx];var label=bay.red?" red star":"";var msg=bay.name+label+"\\n"+(bay.ts||"tidy");var files=camPhotos.map(function(b,i){var lbl=camPhotos.length===1?"":i===0?"_before":"_after";return new File([b],bay.name.replace(/ /g,"_")+lbl+"_"+Date.now()+".jpg",{type:"image/jpeg"})});if(navigator.share&&navigator.canShare&&navigator.canShare({files:files})){navigator.share({text:msg,files:files}).then(function(){toast("Shared!");camPhotos=[];closeCam()}).catch(function(){})}else{var ta=document.getElementById("copyText");ta.value=msg;oP("copyPopup");ta.focus();ta.select();saveAll()}}
function saveAll(){if(camBlob)camPhotos.push(camBlob);camPhotos.forEach(function(b,i){var a=document.createElement("a");a.href=URL.createObjectURL(b);var lbl=camPhotos.length===1?"":i===0?"_before":"_after";a.download=bays[camIdx].name.replace(/ /g,"_")+lbl+"_"+Date.now()+".jpg";document.body.appendChild(a);a.click();document.body.removeChild(a)});toast(camPhotos.length+" saved");camPhotos=[]}
function closeCam(){stopCam();cP("camPopup");camPhotos=[];camBlob=null}

// ===== INIT =====
document.getElementById("zBre").className=curZone==="bre1"?"zbtn active":"zbtn";
document.getElementById("zWm").className=curZone==="wm"?"zbtn active":"zbtn";
drawBoundary();renderBays();setInterval(pace,30000);
`;

// Verify
try { new Function(js); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = js.split('\n');
  for(var i=0;i<lines.length;i++){try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){console.log("Line "+(i+1)+": "+e2.message);console.log(lines[i].substring(0,100));break}}
  process.exit(1);
}
console.log("JS SYNTAX: OK");

html.push(js);
html.push('<\/script><\/body><\/html>');
fs.writeFileSync('index.html', html.join('\n'));
console.log("v12 written! Size:", html.join('\n').length);
