var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// ============================================
// 1. APPLE-STYLE MAP TILES
// ============================================
// Replace OSM tiles with CartoDB Voyager (Apple Maps lookalike)
var oldTile = 'https://tile.openstreetmap.org/' + '{z}/{x}/{y}' + '.png';
var newTile = 'https://' + '{s}' + '.basemaps.cartocdn.com/rastertiles/voyager/' + '{z}/{x}/{y}' + '@2x.png';
c = c.replace(
  'var TILE_URL="' + oldTile + '"',
  'var TILE_URL="' + newTile + '"'
);

// ============================================
// 2. ROUTE PERSISTS AFTER BIKE REFRESH
// ============================================
// Store last route in memory so refreshOnly doesn't destroy it
c = c.replace(
  'var routeLine=null;',
  'var routeLine=null;var lastRoute=null;var prevBikes={};var bikeChurn={};'
);

// Don't clear route line on bike refresh - only clear on new route calc
c = c.replace(
  'function refreshOnly(){',
  'function refreshOnly(){var oldBikeData={};bMarks.forEach(function(m){var l=m.getLatLng();var key=l.lat.toFixed(5)+","+l.lng.toFixed(5);oldBikeData[key]=true});'
);

// After bikes load, track churn
var oldRefreshEnd = "renderBays();toast((d.count||0)+\" bikes loaded\");";
var newRefreshEnd = oldRefreshEnd + "\ntrackChurn(oldBikeData);";
c = c.replace(oldRefreshEnd, newRefreshEnd);

// ============================================
// 3. BPH SURVIVES BAY RESET (only End Shift stops timer)
// ============================================
c = c.replace(
  'function resetBays(){if(!confirm("Reset all bays?"))return;bays.forEach(function(b){b.ts=null;b.at=null});ss=null;localStorage.removeItem(SHIFT_KEY);save();renderBays();toast("Bays reset")}',
  'function resetBays(){if(!confirm("Reset bays for another round?"))return;bays.forEach(function(b){b.ts=null;b.at=null});save();renderBays();toast("Bays reset - shift timer still running")}'
);

// ============================================
// 4. BIKE CHURN / MESSINESS DETECTION
// ============================================
var churnCode = `
function trackChurn(oldData){
  var newData={};
  bMarks.forEach(function(m){var l=m.getLatLng();var key=l.lat.toFixed(5)+","+l.lng.toFixed(5);newData[key]=true});
  // For each bay, count how many bikes changed nearby
  bays.forEach(function(bay){
    var bayKey=bay.name;
    if(!bikeChurn[bayKey])bikeChurn[bayKey]={changes:0,checks:0};
    bikeChurn[bayKey].checks++;
    var oldNear=0,newNear=0;
    Object.keys(oldData).forEach(function(k){var p=k.split(",");if(dist(bay.lat,bay.lng,parseFloat(p[0]),parseFloat(p[1]))<=zData.radius)oldNear++});
    Object.keys(newData).forEach(function(k){var p=k.split(",");if(dist(bay.lat,bay.lng,parseFloat(p[0]),parseFloat(p[1]))<=zData.radius)newNear++});
    var delta=Math.abs(newNear-oldNear);
    bikeChurn[bayKey].changes+=delta;
  });
}
function getChurn(bay){
  var ck=bikeChurn[bay.name];
  if(!ck||ck.checks<2)return 0;
  return Math.round(ck.changes/ck.checks*10)/10;
}
function isMessy(bay){return getChurn(bay)>=2}
`;

c = c.replace('function loadBays(){', churnCode + '\nfunction loadBays(){');

// ============================================
// 5. ROAD-BASED ROUTING VIA OSRM
// ============================================
// Replace straight-line cluster ordering with OSRM walking distance
// Add OSRM helper function
var osrmCode = `
function osrmRoute(coords,callback){
  if(coords.length<2){callback(coords);return}
  var pts=coords.map(function(c){return c[1]+","+c[0]}).join(";");
  fetch("https://router.project-osrm.org/route/v1/foot/"+pts+"?overview=full&geometries=geojson")
    .then(function(r){return r.json()})
    .then(function(data){
      if(data.routes&&data.routes[0]){
        callback(data.routes[0].geometry.coordinates.map(function(c){return[c[1],c[0]]}));
      }else{callback(coords)}
    })
    .catch(function(){callback(coords)});
}
`;

c = c.replace('function loadBays(){', osrmCode + '\nfunction loadBays(){');

// Update showRoute to use OSRM for the route line
c = c.replace(
  'if(routeLine){map.removeLayer(routeLine);routeLine=null}\n' +
  'var coords=[[uLat,uLng]];fullRoute.forEach(function(r){coords.push([r.bay.lat,r.bay.lng])});\n' +
  'routeLine=L.polyline(coords,{color:"#BF5AF2",weight:3,opacity:0.6,dashArray:"8 6"}).addTo(map);',

  'if(routeLine){map.removeLayer(routeLine);routeLine=null}\n' +
  'var coords=[[uLat,uLng]];fullRoute.forEach(function(r){coords.push([r.bay.lat,r.bay.lng])});\n' +
  'osrmRoute(coords,function(roadCoords){\n' +
  '  routeLine=L.polyline(roadCoords,{color:"#BF5AF2",weight:3,opacity:0.7}).addTo(map);\n' +
  '});'
);

// Add churn info to bay popups
c = c.replace(
  'var bikeInfo=bc>0?"<span style=\'color:"+(overCap?"#FF453A":"#32D74B")+";font-weight:700\'>"+bc+" bikes"+(overCap?" OVER CAPACITY":"")+"</span><br>":"";',
  'var churn=getChurn(bay);var messy=isMessy(bay);\n' +
  'var bikeInfo=bc>0?"<span style=\'color:"+(overCap?"#FF453A":"#32D74B")+";font-weight:700\'>"+bc+" bikes"+(overCap?" OVER CAPACITY":"")+"</span>"+(messy?" <span style=\'color:#FF9F0A\'>\\ud83c\\udf00 HIGH CHURN</span>":"")+"<br>":"";'
);

// Add messiness to route scoring
c = c.replace(
  'var bonus=remC[k].items.some(function(x){return x.overCap})?-500:0;',
  'var bonus=remC[k].items.some(function(x){return x.overCap})?-500:0;\n' +
  '      bonus+=remC[k].items.filter(function(x){return isMessy(x.bay)}).length*-200;'
);

// ============================================
// VERIFY
// ============================================
var sc = c.split('<script>')[1].split('<\/script>')[0];
try {
  new Function(sc);
  console.log("JS SYNTAX: OK");
} catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){
    try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){
      console.log("Line "+(i+1)+": "+e2.message);
      console.log(lines[i].substring(0,100));
      break;
    }
  }
  process.exit(1);
}

fs.writeFileSync('index.html', c);
console.log("v4 build complete!");
console.log("- Apple-style map tiles");
console.log("- Route persists after refresh");
console.log("- BPH survives reset");
console.log("- Bike churn detection");
console.log("- OSRM road routing");
