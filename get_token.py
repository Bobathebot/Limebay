import cloudscraper

scraper = cloudscraper.create_scraper()
url = 'https://web-production.lime.bike/api/rider/v1/login'
headers = {
    'Platform': 'iOS',
    'App-Version': '3.248.1',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}
data = {
    "login_code": "749006",
    "phone": "+447877414926"
}

print("Sending OTP code...")
r = scraper.post(url, json=data, headers=headers)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:1500]}")
