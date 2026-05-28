import asyncio
import httpx
import time

async def fetch_yahoo_ticker(symbol: str) -> tuple[float, float]:
    """Fetch live price and percentage change from Yahoo Finance API."""
    async with httpx.AsyncClient(timeout=1.5) as client:
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            headers = {"User-Agent": "Mozilla/5.0"}
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                meta = data.get("chart", {}).get("result", [{}])[0].get("meta", {})
                price = meta.get("regularMarketPrice")
                prev_close = meta.get("chartPreviousClose")
                if price and prev_close:
                    change = round(((price - prev_close) / prev_close) * 100, 2)
                    return float(price), change
        except Exception as e:
            print(f"Failed to scrape {symbol} from Yahoo: {e}")
    return 0.0, 0.0

async def main():
    symbol = "USDINR=X" # USD/INR
    print(f"Testing fetch_yahoo_ticker for {symbol}...")
    start = time.time()
    price, change = await fetch_yahoo_ticker(symbol)
    print(f"Done in {time.time() - start:.2f} seconds!")
    print(f"Price: {price}, Change: {change}%")

asyncio.run(main())
