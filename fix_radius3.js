var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Restore real-life accurate radii
c = c.replace(
  'bre1:{center:[51.5385,-0.2150],zoom:14,radius:15,maxCap:10,',
  'bre1:{center:[51.5385,-0.2150],zoom:14,radius:25,maxCap:10,'
);
c = c.replace(
  'wm:{center:[51.5220,-0.1570],zoom:15,radius:8,maxCap:6,',
  'wm:{center:[51.5220,-0.1570],zoom:15,radius:20,maxCap:6,'
);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) { console.log("JS ERROR:", e.message); process.exit(1); }
fs.writeFileSync('index.html', c);
console.log("Restored: BRE1=25m, WM=20m (real life accurate)");
