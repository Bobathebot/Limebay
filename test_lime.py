import cloudscraper

scraper = cloudscraper.create_scraper()
url = 'https://web-production.lime.bike/api/rider/v1/login?phone=%2B447877414926'
headers = {
    'Platform': 'iOS',
    'App-Version': '3.248.1',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print("Attempting to bypass Cloudflare...")
r = scraper.get(url, headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")
