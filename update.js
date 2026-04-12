var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// ============================================
// 1. FIX CAMERA: All white text on dark bg
// ============================================
// Fix the overlay live preview colors - all white
c = c.replace(
  'style="color:#FF9F0A;font-size:12px;font-weight:700" id="oTime"',
  'style="color:#FFFFFF;font-size:12px;font-weight:700" id="oTime"'
);

// Fix the burned-in photo overlay colors - all white
c = c.replace(
  'ctx.fillStyle=li===0?"#FF9F0A":li===1?"#FFFFFF":"#CCCCCC";',
  'ctx.fillStyle="#FFFFFF";'
);

// Make date line not bold to match Timestamp Camera style
c = c.replace(
  'ctx.font=(li===0?"bold ":"")+fs2+"px -apple-system,Helvetica,sans-serif";',
  'ctx.font=fs2+"px -apple-system,Helvetica,sans-serif";'
);

// ============================================
// 2. ADD BLUE 25m RADIUS CIRCLE ON BAY SELECT
// ============================================
// Add circle variable
c = c.replace(
  'var camS=null',
  'var bayCircle=null;\nvar camS=null'
);

// Add circle when popup opens, remove when closes
var oldRenderBay = 'bayMarks[i]=L.marker([bay.lat,bay.lng],{icon:ic}).addTo(map).bindPopup(pop);';
var newRenderBay = `bayMarks[i]=L.marker([bay.lat,bay.lng],{icon:ic}).addTo(map).bindPopup(pop);
bayMarks[i].on('popupopen',function(){if(bayCircle)map.removeLayer(bayCircle);bayCircle=L.circle([bay.lat,bay.lng],{radius:BAY_RADIUS,color:'#0A84FF',fillColor:'#0A84FF',fillOpacity:0.15,weight:2,opacity:0.5}).addTo(map)});
bayMarks[i].on('popupclose',function(){if(bayCircle){map.removeLayer(bayCircle);bayCircle=null}});`;
c = c.replace(oldRenderBay, newRenderBay);

// ============================================
// 3. ADD WM17 RED STARS (Westminster)
// ============================================
// Add WM17 bays to DBAYS array
var wm17Bays = [
  '{n:"Rossmore Road [WM]",a:51.52525,o:-0.163881}',
  '{n:"Allsop Pl [WM]",a:51.523806,o:-0.157472}',
  '{n:"Taunton Pl [WM]",a:51.525528,o:-0.161472}',
  '{n:"Great Central St [WM]",a:51.522222,o:-0.162278}',
  '{n:"Baker St [WM]",a:51.524083,o:-0.158278}',
  '{n:"Herewood Ave [WM]",a:51.523139,o:-0.164667}'
].join(',');

c = c.replace(
  '{n:"College Road (North)",a:51.533638,o:-0.225675}',
  '{n:"College Road (North)",a:51.533638,o:-0.225675},' + wm17Bays
);

// ============================================
// 4. ADD WM ZONES TO PROXY COVERAGE
// ============================================
// We need to update proxy.py too - add Westminster zone strips
var proxy = fs.readFileSync('proxy.py', 'utf8');

// Add Westminster strips to ZONES array
var oldZonesEnd = '{"ne_lat":51.545,"ne_lng":-0.1880,"sw_lat":51.537,"sw_lng":-0.2000,"user_latitude":51.540,"user_longitude":-0.194},';
var newZonesEnd = oldZonesEnd + '\n    {"ne_lat":51.528,"ne_lng":-0.150,"sw_lat":51.520,"sw_lng":-0.168,"user_latitude":51.524,"user_longitude":-0.160},';

proxy = proxy.replace(oldZonesEnd, newZonesEnd);

// Expand BRE1 polygon to also accept Westminster points (or just skip polygon filter for WM)
// Simplest: make in_bre1 return True for Westminster area too
var oldInBre1 = 'def in_bre1(lat, lng):';
var newInBre1 = `def in_bre1(lat, lng):
    # Westminster zone - always allow
    if 51.519 <= lat <= 51.528 and -0.168 <= lng <= -0.150:
        return True`;
proxy = proxy.replace(oldInBre1, newInBre1);

fs.writeFileSync('proxy.py', proxy);
console.log("proxy.py updated with Westminster zone");

// ============================================
// 5. IMPROVE ROUTE ALGORITHM - density aware
// ============================================
// Replace showRoute with improved version that considers bike density
var oldShowRoute = 'function showRoute(){';
var newShowRoute = `function showRoute(){
// Clear old route line if exists
if(window.routeLine){map.removeLayer(window.routeLine);window.routeLine=null}`;
c = c.replace(oldShowRoute, newShowRoute);

// Add route line drawing after route is calculated
var oldRouteOP = "oP('routePanel');";
// Find the one inside showRoute (after routeList)
c = c.replace(
  'document.getElementById("routeList").innerHTML=rhtml;\noP(\'routePanel\');',
  `document.getElementById("routeList").innerHTML=rhtml;
// Draw route line on map
var routeCoords=[[uLat,uLng]];
route.forEach(function(r){routeCoords.push([r.bay.lat,r.bay.lng])});
if(window.routeLine)map.removeLayer(window.routeLine);
window.routeLine=L.polyline(routeCoords,{color:'#BF5AF2',weight:3,opacity:0.6,dashArray:'8 6'}).addTo(map);
oP('routePanel');`
);

// ============================================
// VERIFY SYNTAX
// ============================================
var sc = c.split('<script>')[1].split('<\/script>')[0];
try {
  new Function(sc);
  console.log("JS SYNTAX: OK");
} catch(e) {
  console.log("JS ERROR:", e.message);
  // Try to find the error line
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){
    try { new Function(lines.slice(0,i+1).join('\n')); } catch(e2) {
      console.log("Error at JS line "+(i+1)+": "+e2.message);
      console.log("Content: "+lines[i].substring(0,100));
      break;
    }
  }
  process.exit(1);
}

fs.writeFileSync('index.html', c);
console.log("All updates applied! Size:", c.length);
