// proxy.js — runs on localhost:3001
// Forwards all /api/transit/* requests to transit.land
// Solves CORS: browser talks to localhost, localhost talks to Transitland
//
// Your API key stays server-side — never exposed in browser network tab

require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const fetch    = require("node-fetch");

const app  = express();
const PORT = 3001;
const TRANSITLAND_BASE = "https://transit.land/api/v2/rest";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

// Proxy route: GET /api/transit/:endpoint
// e.g. /api/transit/routes?operator_onestop_id=o-dpz8-ttc
app.get("/api/transit/*", async (req, res) => {
  try {
    // Extract the path after /api/transit/
    const subpath = req.path.replace("/api/transit/", "");

    // Forward all query params from the browser request
    const params = new URLSearchParams(req.query);

    // Inject the API key server-side (read from env var)
    const apiKey = process.env.TRANSITLAND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "TRANSITLAND_API_KEY not set in environment" });
    }
    params.set("apikey", apiKey);

    const upstreamUrl = `${TRANSITLAND_BASE}/${subpath}?${params.toString()}`;
    console.log(`[proxy] → ${upstreamUrl.replace(apiKey, "***")}`);

    const upstream = await fetch(upstreamUrl, {
      headers: { "Accept": "application/json" },
    });

    const body = await upstream.json();

    if (!upstream.ok) {
      console.error(`[proxy] upstream error ${upstream.status}:`, body);
      return res.status(upstream.status).json(body);
    }

    res.json(body);
  } catch (err) {
    console.error("[proxy] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚇 Transit proxy running at http://localhost:${PORT}`);
  console.log(`   Forwarding /api/transit/* → ${TRANSITLAND_BASE}/*`);
  console.log(`   API key: ${process.env.TRANSITLAND_API_KEY ? "✓ loaded from env" : "✗ NOT SET — add TRANSITLAND_API_KEY to .env"}\n`);
});
