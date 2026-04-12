#!/usr/bin/env python3
import http.server, json, os, sys

import cloudscraper

import os; PORT = int(os.environ.get("PORT", 8080))
TOKEN = "eyJraWQiOiJrcjM1bGx0Ymg1dTIiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX3Rva2VuIjoiWVlKQ1JST05VVTdVUSIsImxvZ2luX2NvdW50Ijo2LCJleHBpcmVzX2F0IjoxNzc1OTM5ODc4LCJpYXQiOjE3NzU5Mzk3NTh9.n7Q9-QfIMp1YQIHdHNcFvETK6wD6DQ_zGlY7eio_ymA"

# 8 strips: longitude range -0.282 to -0.190, each ~0.0115 wide
# Also split north/south at 51.540 for the dense middle strips
ZONES = [
    # Far west
    {"ne_lat":51.553,"ne_lng":-0.2588,"sw_lat":51.527,"sw_lng":-0.2820,"user_latitude":51.540,"user_longitude":-0.270},
    # West
    {"ne_lat":51.553,"ne_lng":-0.2363,"sw_lat":51.527,"sw_lng":-0.2588,"user_latitude":51.538,"user_longitude":-0.247},
    # Central-west south
    {"ne_lat":51.540,"ne_lng":-0.2138,"sw_lat":51.527,"sw_lng":-0.2363,"user_latitude":51.533,"user_longitude":-0.225},
    # Central-west north
    {"ne_lat":51.553,"ne_lng":-0.2138,"sw_lat":51.540,"sw_lng":-0.2363,"user_latitude":51.545,"user_longitude":-0.225},
    # Central-east south
    {"ne_lat":51.540,"ne_lng":-0.1900,"sw_lat":51.527,"sw_lng":-0.2138,"user_latitude":51.533,"user_longitude":-0.200},
    # Central-east north
    {"ne_lat":51.553,"ne_lng":-0.1900,"sw_lat":51.540,"sw_lng":-0.2138,"user_latitude":51.545,"user_longitude":-0.200},
    # Far east south (catches Malvern, Cambridge Ave, Coventry)
    {"ne_lat":51.537,"ne_lng":-0.1880,"sw_lat":51.525,"sw_lng":-0.2000,"user_latitude":51.531,"user_longitude":-0.194},
    # Far east north (catches Brondesbury, Priory Park)
    {"ne_lat":51.545,"ne_lng":-0.1880,"sw_lat":51.537,"sw_lng":-0.2000,"user_latitude":51.540,"user_longitude":-0.194},
]

BRE1 = [
    (51.5524661,-0.2571598),(51.5517801,-0.2608551),(51.5483151,-0.2631213),
    (51.5463647,-0.2685598),(51.5437780,-0.2730777),(51.5399374,-0.2775980),
    (51.5387313,-0.2813762),(51.5358572,-0.2779626),(51.5321862,-0.2644704),
    (51.5327452,-0.2643914),(51.5348561,-0.2602138),(51.5330767,-0.2538842),
    (51.5296053,-0.2495372),(51.5333164,-0.2462095),(51.5323539,-0.2429441),
    (51.5331569,-0.2343919),(51.5314549,-0.2304148),(51.5307439,-0.2272698),
    (51.5305549,-0.2235347),(51.5285089,-0.2157287),(51.5297629,-0.2157477),
    (51.5304819,-0.2150217),(51.5319439,-0.2149877),(51.5334390,-0.2035490),
    (51.5309889,-0.1978634),(51.5283487,-0.1980617),(51.5277080,-0.1966884),
    (51.5334839,-0.1920883),(51.5345389,-0.1927233),(51.5368809,-0.1911753),
    (51.5505629,-0.2066466),(51.5464469,-0.2214934),(51.5436179,-0.2389171),
    (51.5503432,-0.2548816),(51.5524661,-0.2571598)
]

def in_bre1(lat, lng):
    n = len(BRE1); inside = False; j = n - 1
    for i in range(n):
        yi, xi = BRE1[i]; yj, xj = BRE1[j]
        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

scraper = cloudscraper.create_scraper()

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/bikes"):
            self.get_bikes()
        elif self.path == "/" or self.path == "/index.html":
            self.path = "/index.html"
            super().do_GET()
        else:
            super().do_GET()

    def get_bikes(self):
        hdrs = {"Authorization":"Bearer "+TOKEN,"Platform":"iOS","App-Version":"3.248.1","Content-Type":"application/json","Accept":"application/json"}
        all_bikes = []
        seen = set()
        raw = 0
        capped = 0
        for i, zone in enumerate(ZONES):
            try:
                r = scraper.get("https://web-production.lime.bike/api/rider/v2/map/bike_pins", params={**zone,"zoom":16.0}, headers=hdrs)
                pins = r.json().get("data",{}).get("attributes",{}).get("bike_pins",[])
                raw += len(pins)
                if len(pins) >= 200:
                    capped += 1
                added = 0
                for pin in pins:
                    bid = pin.get("id","")
                    if bid in seen: continue
                    seen.add(bid)
                    loc = pin.get("location",{})
                    lat = loc.get("latitude",0)
                    lng = loc.get("longitude",0)
                    if in_bre1(lat, lng):
                        all_bikes.append({"id":bid,"lat":lat,"lng":lng,"type":pin.get("sub_type_name","unknown")})
                        added += 1
                print(f"  Strip {i+1}: {len(pins)} raw, {added} in BRE1" + (" [CAPPED]" if len(pins)>=200 else ""))
            except Exception as e:
                print(f"  Strip {i+1} error: {e}")
        out = json.dumps({"bikes":all_bikes,"count":len(all_bikes)})
        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*")
        self.end_headers()
        self.wfile.write(out.encode())
        print(f"  TOTAL: {raw} raw -> {len(all_bikes)} in BRE1 ({capped} strips capped)")

print(f"LimeBay on http://localhost:{PORT}")
print(f"  8 strips + BRE1 polygon filter")
print(f"  8 calls per refresh (same as scrolling the map for 30 secs)")
http.server.HTTPServer(("",PORT),Handler).serve_forever()
