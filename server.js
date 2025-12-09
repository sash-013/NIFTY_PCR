// server.js — Node 18+ (ESM)
import express from "express";
import fetch from "node-fetch";

const app = express();
app.disable("x-powered-by");

const VALID_TOKEN = process.env.PROXY_TOKEN || "";

app.get("/nse-proxy/option-chain", async (req, res) => {
  try {
    if (VALID_TOKEN) {
      const t = req.query.token || "";
      if (t !== VALID_TOKEN) return res.status(401).json({ error: "Unauthorized - invalid token" });
    }

    const NSE_HOME = "https://www.nseindia.com";
    const API_URL = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";

    // 1) fetch NSE home to get cookies
    const homeResp = await fetch(NSE_HOME, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const cookieHeaders = homeResp.headers.raw()["set-cookie"] || [];
    const cookieHeader = cookieHeaders.map(c => c.split(";")[0]).join("; ");

    // 2) fetch option-chain using those cookies
    const apiResp = await fetch(API_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://www.nseindia.com/market-data/live-equity-market",
        "Cookie": cookieHeader,
        "Accept": "application/json, text/javascript, */*; q=0.01"
      }
    });

    const text = await apiResp.text();
    const trimmed = (text || "").trim();
    if (trimmed && (trimmed[0] === "{" || trimmed[0] === "[")) {
      res.type("application/json").status(apiResp.status).send(text);
    } else {
      res.type("text/plain").status(apiResp.status).send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
