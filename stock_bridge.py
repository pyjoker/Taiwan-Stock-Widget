#!/usr/bin/env python3
"""
Taiwan Stock Widget - Python data bridge
Spawned by Electron main process; outputs a single JSON line to stdout.

Usage:
  python stock_bridge.py fetch   <json_symbols_array>
  python stock_bridge.py detect  <code>

fetch  arg: JSON array of {code, market} objects, e.g. [{"code":"2330","market":"tse"}]
detect arg: bare stock code, e.g. "2330"

Exit code 0 on success, 1 on error (error JSON written to stdout).
"""
import sys
import json
import time
import random

import requests
from yahooquery import Ticker


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _jitter(lo: float = 0.3, hi: float = 1.0) -> None:
    """Sleep for a random duration to avoid bot-detection by Yahoo."""
    time.sleep(random.uniform(lo, hi))


def _safe_float(val, default: float = 0.0) -> float:
    try:
        return float(val) if val is not None else default
    except (TypeError, ValueError):
        return default


# ─── Chinese name lookup (TWSE / TPEx open data) ─────────────────────────────
# Fetched once per process lifetime; falls back to Yahoo's name if unavailable.

_tw_names: dict[str, str] = {}
_tw_names_loaded = False


def _ensure_tw_names() -> None:
    global _tw_names_loaded
    if _tw_names_loaded:
        return
    _tw_names_loaded = True  # mark before fetching so retries don't pile up

    # TSE listed companies (上市)
    try:
        r = requests.get(
            "https://opendata.twse.com.tw/v1/company/companySummary",
            timeout=8,
            headers={"Accept": "application/json"},
        )
        if r.ok:
            for row in r.json():
                code = str(row.get("公司代號") or "").strip()
                name = str(row.get("公司簡稱") or "").strip()
                if code and name:
                    _tw_names[code] = name
    except Exception:
        pass

    # TPEx listed companies (上櫃)
    try:
        r = requests.get(
            "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_listed_companies",
            timeout=8,
            headers={"Accept": "application/json"},
        )
        if r.ok:
            for row in r.json():
                # Field names may be English or Chinese depending on API version
                code = str(
                    row.get("SecuritiesCompanyCode") or row.get("公司代號") or ""
                ).strip()
                name = str(
                    row.get("CompanyAbbreviation") or row.get("公司簡稱") or ""
                ).strip()
                if code and name and code not in _tw_names:
                    _tw_names[code] = name
    except Exception:
        pass


def _tw_name(code: str, yahoo_fallback: str) -> str:
    """Return Chinese name for a Taiwan stock code, or yahoo_fallback."""
    return _tw_names.get(code) or yahoo_fallback


# ─── fetch mode ───────────────────────────────────────────────────────────────

def fetch_stocks(symbols: list) -> list:
    """
    symbols: list of {code: str, market: "tse"|"otc"|"us"}
    Returns list of StockInfo-compatible dicts.
    """
    if not symbols:
        return []

    _ensure_tw_names()

    ticker_to_info: dict[str, dict] = {}
    for s in symbols:
        code = s["code"]
        market = s["market"]
        if market == "us":
            ticker_sym = code  # US tickers have no suffix (e.g. AAPL, TSLA)
        elif market == "tse":
            ticker_sym = f"{code}.TW"
        else:
            ticker_sym = f"{code}.TWO"
        ticker_to_info[ticker_sym] = {"code": code, "market": market}

    _jitter(0.3, 1.0)

    t = Ticker(list(ticker_to_info.keys()), asynchronous=True)
    price_data = t.price  # dict: ticker -> price dict (or error string)

    result = []
    for ticker_sym, info in ticker_to_info.items():
        q = price_data.get(ticker_sym)
        if not isinstance(q, dict):
            continue  # yahooquery returns a string on error

        yesterday_close = _safe_float(q.get("regularMarketPreviousClose"))
        market_state = q.get("marketState", "")
        is_after_hours = market_state != "REGULAR"

        if is_after_hours:
            price = yesterday_close
            change = 0.0
            change_percent = 0.0
        else:
            price = _safe_float(q.get("regularMarketPrice"), yesterday_close)
            change = price - yesterday_close
            change_percent = (change / yesterday_close * 100) if yesterday_close != 0 else 0.0

        yahoo_name = (q.get("shortName") or q.get("longName") or info["code"]).strip()
        # For US stocks, always use Yahoo's name; TW stocks use Chinese name lookup
        name = yahoo_name if info["market"] == "us" else _tw_name(info["code"], yahoo_name)

        raw_volume = _safe_float(q.get("regularMarketVolume"))
        # TW stocks: divide by 1000 for 張 (lot) convention; US stocks: keep raw shares
        volume = round(raw_volume) if info["market"] == "us" else round(raw_volume / 1000)

        result.append({
            "code": info["code"],
            "name": name,
            "price": price,
            "yesterdayClose": yesterday_close,
            "change": change,
            "changePercent": change_percent,
            "high": _safe_float(q.get("regularMarketDayHigh")),
            "low": _safe_float(q.get("regularMarketDayLow")),
            "volume": volume,
            "isAfterHours": is_after_hours,
            "market": info["market"],
        })

    return result


# ─── detect mode ──────────────────────────────────────────────────────────────

def detect_market(code: str):
    """
    Try TSE (.TW) then OTC (.TWO) then plain ticker (US).
    Returns "tse", "otc", "us", or null (JSON null).
    """
    # Try Taiwan markets first (TSE and TPEx)
    for market, suffix in [("tse", ".TW"), ("otc", ".TWO")]:
        _jitter(0.2, 0.6)
        ticker_sym = f"{code}{suffix}"
        try:
            t = Ticker(ticker_sym)
            price_data = t.price
            q = price_data.get(ticker_sym)
            if isinstance(q, dict):
                if q.get("regularMarketPrice") is not None or q.get("regularMarketPreviousClose") is not None:
                    return market
        except Exception:
            pass

    # Try as US ticker (plain code, no suffix)
    _jitter(0.2, 0.6)
    try:
        t = Ticker(code)
        price_data = t.price
        q = price_data.get(code)
        if isinstance(q, dict):
            # Confirm it's a real US-listed equity by checking exchange info
            exchange = q.get("exchangeName", "") or q.get("fullExchangeName", "") or ""
            if q.get("regularMarketPrice") is not None or q.get("regularMarketPreviousClose") is not None:
                if exchange and "Taiwan" not in exchange and "TWS" not in exchange:
                    return "us"
    except Exception:
        pass

    return None


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: stock_bridge.py <fetch|detect> <arg>"}))
        sys.exit(1)

    mode = sys.argv[1]

    try:
        if mode == "fetch":
            symbols = json.loads(sys.argv[2])
            output = fetch_stocks(symbols)
        elif mode == "detect":
            output = detect_market(sys.argv[2])
        else:
            print(json.dumps({"error": f"Unknown mode: {mode}"}))
            sys.exit(1)

        print(json.dumps(output))

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
