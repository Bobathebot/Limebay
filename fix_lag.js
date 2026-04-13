var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Remove the 2-opt functions entirely
c = c.replace(/function twoOpt\(route\)\{[\s\S]*?return route;\n\}/, 'function twoOpt(route){return route}');
c = c.replace(/function routeDist\(r\)\{[^}]+\}/, 'function routeDist(r){return 0}');
c = c.replace(/function recalcDists\(r\)\{[\s\S]*?\n\}/, 'function recalcDists(r){var pLat=uLat,pLng=uLng;for(var i=0;i<r.length;i++){r[i].dist=dist(pLat,pLng,r[i].bay.lat,r[i].bay.lng);pLat=r[i].bay.lat;pLng=r[i].bay.lng}}');

// Also remove the 2-opt call in showRoute
c = c.replace(
  'if(fullRoute.length<=30){recalcDists(fullRoute);fullRoute=twoOpt(fullRoute)}',
  '// 2-opt removed for speed'
);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) { console.log("JS ERROR:", e.message); process.exit(1); }
fs.writeFileSync('index.html', c);
console.log("2-opt removed - Route Plan should be instant now");
