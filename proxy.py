#!/usr/bin/env python3
import http.server, json, os
from curl_cffi import requests as cffi_requests

PORT = int(os.environ.get("PORT", 8080))
TOKEN = "eyJraWQiOiJrcjM1bGx0Ymg1dTIiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX3Rva2VuIjoiWVlKQ1JST05VVTdVUSIsImxvZ2luX2NvdW50Ijo3LCJleHBpcmVzX2F0IjoxNzc1OTk0MTgxLCJpYXQiOjE3NzU5OTQwNjF9.vk_o75En_dyR6ZcwNPWoy4g_C4ROmA4EllfPW48IRL0"

BRE1_ZONES = [
    {"ne_lat":51.553,"ne_lng":-0.2588,"sw_lat":51.527,"sw_lng":-0.2820,"user_latitude":51.540,"user_longitude":-0.270},
    {"ne_lat":51.553,"ne_lng":-0.2363,"sw_lat":51.527,"sw_lng":-0.2588,"user_latitude":51.538,"user_longitude":-0.247},
    {"ne_lat":51.540,"ne_lng":-0.2138,"sw_lat":51.527,"sw_lng":-0.2363,"user_latitude":51.533,"user_longitude":-0.225},
    {"ne_lat":51.553,"ne_lng":-0.2138,"sw_lat":51.540,"sw_lng":-0.2363,"user_latitude":51.545,"user_longitude":-0.225},
    {"ne_lat":51.540,"ne_lng":-0.1900,"sw_lat":51.527,"sw_lng":-0.2138,"user_latitude":51.533,"user_longitude":-0.200},
    {"ne_lat":51.553,"ne_lng":-0.1900,"sw_lat":51.540,"sw_lng":-0.2138,"user_latitude":51.545,"user_longitude":-0.200},
    {"ne_lat":51.537,"ne_lng":-0.1880,"sw_lat":51.525,"sw_lng":-0.2000,"user_latitude":51.531,"user_longitude":-0.194},
    {"ne_lat":51.545,"ne_lng":-0.1880,"sw_lat":51.537,"sw_lng":-0.2000,"user_latitude":51.540,"user_longitude":-0.194},
]
WM_ZONES = [
    {"ne_lat":51.531,"ne_lng":-0.155,"sw_lat":51.523,"sw_lng":-0.175,"user_latitude":51.526,"user_longitude":-0.165},
    {"ne_lat":51.531,"ne_lng":-0.144,"sw_lat":51.523,"sw_lng":-0.155,"user_latitude":51.527,"user_longitude":-0.150},
    {"ne_lat":51.523,"ne_lng":-0.148,"sw_lat":51.514,"sw_lng":-0.165,"user_latitude":51.518,"user_longitude":-0.157},
    {"ne_lat":51.523,"ne_lng":-0.144,"sw_lat":51.514,"sw_lng":-0.148,"user_latitude":51.518,"user_longitude":-0.146},
]

BRE1_POLY = [
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

WM5_POLY = [
    (51.521045,-0.163668),(51.514396,-0.160664),(51.516891,-0.145998),
    (51.523366,-0.148938),(51.523340,-0.149110),(51.523140,-0.150869),
    (51.522926,-0.152929),(51.522218,-0.156792),(51.521045,-0.163668)
]

WM17_POLY = [
    (51.520967,-0.164288),(51.522926,-0.152929),(51.523366,-0.148938),
    (51.523977,-0.145201),(51.525267,-0.145764),(51.525035,-0.147124),
    (51.524893,-0.148421),(51.523971,-0.153914),(51.523718,-0.155630),
    (51.524278,-0.157283),(51.524839,-0.158592),(51.526414,-0.159879),
    (51.526895,-0.160716),(51.528751,-0.163656),(51.528657,-0.163892),
    (51.528337,-0.165479),(51.528617,-0.165909),(51.530433,-0.168140),
    (51.529632,-0.169986),(51.527709,-0.174170),(51.527122,-0.173419),
    (51.525400,-0.169621),(51.524759,-0.168269),(51.523718,-0.166928),
    (51.522963,-0.165887),(51.522436,-0.165276),(51.520967,-0.164288)
]

def pip(lat, lng, poly):
    n = len(poly)
    inside = False
    j = n - 1
    for i in range(n):
        yi, xi = poly[i]
        yj, xj = poly[j]
        if ((yi > lat) != (yj > lat)) and (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def in_bre1(lat, lng):
    return pip(lat, lng, BRE1_POLY)

def in_wm(lat, lng):
    return pip(lat, lng, WM5_POLY) or pip(lat, lng, WM17_POLY)

scraper = cffi_requests

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
        zone = "wm" if "zone=wm" in self.path else "bre1"
        zones = BRE1_ZONES if zone == "bre1" else WM_ZONES
        filter_fn = in_bre1 if zone == "bre1" else in_wm
        hdrs = {"Authorization":"Bearer "+TOKEN,"Platform":"iOS","App-Version":"3.248.1","Content-Type":"application/json","Accept":"application/json"}
        all_bikes = []
        seen = set()
        for i, z in enumerate(zones):
            try:
                r = scraper.get("https://web-production.lime.bike/api/rider/v2/map/bike_pins", params=dict(z, zoom=16.0), headers=hdrs, impersonate="chrome")
                pins = r.json().get("data",{}).get("attributes",{}).get("bike_pins",[])
                for pin in pins:
                    bid = pin.get("id","")
                    if bid in seen: continue
                    seen.add(bid)
                    loc = pin.get("location",{})
                    lat = loc.get("latitude",0)
                    lng = loc.get("longitude",0)
                    if filter_fn(lat, lng):
                        all_bikes.append({"id":bid,"lat":lat,"lng":lng,"type":pin.get("sub_type_name","unknown")})
                print("Strip " + str(i+1) + " (" + zone + "): " + str(len(pins)) + " raw")
            except Exception as e:
                print("Strip " + str(i+1) + " error: " + str(e))
        out = json.dumps({"bikes":all_bikes,"count":len(all_bikes)})
        self.send_response(200)
        self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*")
        self.end_headers()
        self.wfile.write(out.encode())
        print("TOTAL (" + zone + "): " + str(len(all_bikes)) + " bikes")

print("LimeBay on port " + str(PORT))
http.server.HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
