var fs = require('fs');
var c = fs.readFileSync('index.html', 'utf8');

// Simply make twoOpt return input unchanged - find "function twoOpt" and replace just the body
// Find the start and end of twoOpt
var start = c.indexOf('function twoOpt(route){');
if (start === -1) { console.log("twoOpt not found - maybe already removed"); }
else {
  // Find matching closing brace
  var depth = 0;
  var pos = c.indexOf('{', start);
  for (var i = pos; i < c.length; i++) {
    if (c[i] === '{') depth++;
    if (c[i] === '}') depth--;
    if (depth === 0) {
      // Replace entire function
      var original = c.substring(start, i + 1);
      c = c.replace(original, 'function twoOpt(route){return route}');
      console.log("twoOpt replaced with no-op");
      break;
    }
  }
}

// Also remove the 2-opt call
c = c.replace(
  'if(fullRoute.length<=30){recalcDists(fullRoute);fullRoute=twoOpt(fullRoute)}',
  '// skip 2-opt'
);

var sc = c.split('<script>')[1].split('<\/script>')[0];
try { new Function(sc); console.log("JS SYNTAX: OK"); } catch(e) {
  console.log("JS ERROR:", e.message);
  var lines = sc.split('\n');
  for(var i=0;i<lines.length;i++){
    try{new Function(lines.slice(0,i+1).join('\n'))}catch(e2){
      console.log("At line "+(i+1)+": "+e2.message);
      console.log(lines[i].substring(0,100));
      break;
    }
  }
  process.exit(1);
}

fs.writeFileSync('index.html', c);
console.log("Done! Route Plan should be instant now");
