import urllib.request
import urllib.error
import time

url = "http://127.0.0.1:8000/api/markets/live"
print(f"Requesting {url}...")
start = time.time()
try:
    with urllib.request.urlopen(url, timeout=5) as response:
        html = response.read().decode()
        print(f"Success in {time.time() - start:.2f} seconds!")
        print("Response (first 200 chars):")
        print(html[:200])
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
except Exception as e:
    print(f"Other Error: {e}")
