var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Change WM radius from 20 to 15
c = c.replace(
  'wm:{center:[51.5220,-0.1570],zoom:15,radius:20,maxCap:6,',
  'wm:{center:[51.5220,-0.1570],zoom:15,radius:15,maxCap:6,'
);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) { console.log("JS ERROR:", e.message); process.exit(1); }
fs.writeFileSync('index.html', c);
console.log("WM radius reduced to 15m");
