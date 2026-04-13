var fs = require('fs');
var proxy = fs.readFileSync('proxy.py', 'utf8');

// Replace the dedup logic - use coordinate-based dedup instead of just ID
proxy = proxy.replace(
    '        all_bikes = []\n        seen = set()',
    '        all_bikes = []\n        seen = set()\n        seen_coords = set()'
);

proxy = proxy.replace(
    '                    if bid in seen: continue\n                    seen.add(bid)',
    '                    coord_key = str(round(lat,5)) + "," + str(round(lng,5))\n                    if coord_key in seen_coords: continue\n                    seen_coords.add(coord_key)\n                    if bid in seen: continue\n                    seen.add(bid)'
);

fs.writeFileSync('proxy.py', proxy);
console.log("Proxy dedup by coordinates added!");
