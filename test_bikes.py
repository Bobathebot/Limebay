import cloudscraper

scraper = cloudscraper.create_scraper()
token = "eyJraWQiOiJrcjM1bGx0Ymg1dTIiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX3Rva2VuIjoiWVlKQ1JST05VVTdVUSIsImxvZ2luX2NvdW50Ijo2LCJleHBpcmVzX2F0IjoxNzc1OTM5ODc4LCJpYXQiOjE3NzU5Mzk3NTh9.n7Q9-QfIMp1YQIHdHNcFvETK6wD6DQ_zGlY7eio_ymA"

url = "https://web-production.lime.bike/api/rider/v2/map/bike_pins"
params = {
    "ne_lat": 51.60,
    "ne_lng": -0.22,
    "sw_lat": 51.53,
    "sw_lng": -0.32,
    "user_latitude": 51.5646,
    "user_longitude": -0.2688,
    "zoom": 14.0
}
headers = {
    "Authorization": f"Bearer {token}",
    "Platform": "iOS",
    "App-Version": "3.248.1",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

print("Pulling live bikes in Brent zone...")
r = scraper.get(url, params=params, headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:2000]}")
