var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Replace the simple bikesAt function with one that assigns each bike to its NEAREST bay only
c = c.replace(
  'function bikesAt(bay){var c=0;bMarks.forEach(function(mk){var l=mk.getLatLng();if(dist(bay.lat,bay.lng,l.lat,l.lng)<=zData.radius)c++});return c}',
  `function bikesAt(bay){
  var c=0;
  bMarks.forEach(function(mk){
    var l=mk.getLatLng();
    var d=dist(bay.lat,bay.lng,l.lat,l.lng);
    if(d>zData.radius)return;
    var dominated=false;
    bays.forEach(function(other){
      if(other===bay)return;
      var d2=dist(other.lat,other.lng,l.lat,l.lng);
      if(d2<d)dominated=true;
    });
    if(!dominated)c++;
  });
  return c;
}`
);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){console.log("Line "+(i+1)+": "+e2.message);console.log(lines[i].substring(0,100));break}}
  process.exit(1);
}
fs.writeFileSync('index.html', c);
console.log("Bike counting fixed - nearest-bay assignment");
