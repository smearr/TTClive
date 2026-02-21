# 🚇 TTClive — Real-Time TTC Transit Dashboard

A real-time transit dashboard for the Toronto Transit Commission (TTC) built with **React**, **Vite**, and a **Node.js/Express proxy server**. Displays live departures, delays, and route information pulled from the [Transitland v2 REST API](https://www.transit.land/).

---

## Features

- Live departure times and delay status for any TTC stop
- Browse all TTC routes — buses, streetcars, and subway lines
- Filter routes by type (bus / streetcar / subway) or search by name/number
- SVG route map with animated active-stop indicator
- Auto-refreshes every 30 seconds with a live countdown
- On-time percentage stats per stop
- LIVE vs STATIC feed indicator per departure
- Secure API key handling — key never exposed in the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Inline CSS with CSS animations |
| API calls | `fetch()` / AJAX via custom hooks |
| Proxy server | Node.js, Express, node-fetch |
| Transit data | Transitland v2 REST API |
| Environment | dotenv |

---

## Project Structure

```
transit-app/
├── proxy.js          # Express proxy server (port 3001)
│                     # Forwards requests to Transitland, injects API key
├── src/
│   ├── main.jsx      # React entry point
│   └── App.jsx       # Full application — components, hooks, API service
├── index.html        # HTML shell
├── vite.config.js    # Vite config (port 5173)
├── package.json
├── .env              # Your API key goes here (never committed)
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher (includes npm)
- A free [Transitland API key](https://www.transit.land/)

### Installation

```bash
# 1. Clone or unzip the project
cd transit-app

# 2. Install dependencies
npm install

# 3. Add your Transitland API key to .env
#    Open .env in any text editor and replace the placeholder:
TRANSITLAND_API_KEY=your_key_here
```

### Running the app

```bash
npm run dev
```

This starts **two processes simultaneously**:
- **Proxy server** → `http://localhost:3001`
- **React dev server** → `http://localhost:5173`

Open your browser to `http://localhost:5173`.

### Stopping the app

Press `Ctrl + C` in the terminal.

---

## How It Works

### The CORS Proxy

Browsers block direct requests to third-party APIs that don't allow cross-origin requests (CORS). Transitland is one of these. Instead of calling Transitland directly from the browser, all requests go through a local Express proxy:

```
Browser → localhost:3001/api/transit/* → transit.land/api/v2/rest/*
```

The proxy:
1. Receives the request from the browser
2. Injects your API key from the `.env` file server-side
3. Forwards the request to Transitland
4. Returns the JSON response to the browser

Your API key is **never sent to the browser** and never appears in the browser's network tab.

### API Calls (in order)

| Call | Endpoint | When |
|---|---|---|
| Fetch all TTC routes | `GET /routes?operator_onestop_id=o-dpz8-ttc` | On app load |
| Fetch stops for a route | `GET /stops?served_by_onestop_ids={route_id}` | On route select |
| Fetch departures for a stop | `GET /stops/{stop_key}/departures?next=90` | On stop select, then every 30s |

### Custom Hooks

The API logic is split into three focused hooks in `App.jsx`:

- **`useRoutes()`** — fetches all TTC routes once on mount
- **`useStopsForRoute(routeId)`** — fetches stops whenever the selected route changes
- **`useDepartures(stopKey)`** — fetches departures and auto-polls every 30 seconds. Uses a cancel ref to prevent stale state updates if the user switches stops mid-fetch.
- **`useCountdown(lastUpdated)`** — reactive countdown timer synced to the last successful fetch

---

## Environment Variables

| Variable | Description |
|---|---|
| `TRANSITLAND_API_KEY` | Your Transitland API key. Get one free at [transit.land](https://www.transit.land/) |

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore` by default.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both proxy and React dev server concurrently |
| `npm run build` | Build the React app for production |
| `npm run preview` | Preview the production build locally |
| `npm run proxy` | Start only the proxy server |
| `npm run vite` | Start only the React dev server |

---

## Troubleshooting

**"API key not set in environment"**
Your `.env` file isn't being read. Make sure the file exists at the project root (same folder as `proxy.js`) and contains `TRANSITLAND_API_KEY=your_key`.

**"Unauthorized"**
Your API key is invalid or has been revoked. Regenerate it at [transit.land](https://www.transit.land/) and update your `.env` file, then restart with `npm run dev`.

**"Network error" / fetch fails in browser**
The proxy server isn't running. Make sure you used `npm run dev` (not just `npm run vite`). Check your terminal for proxy startup errors.

**No departures showing**
Transitland's departure data depends on the time of day and the stop selected. Try a major stop (first in the list) and check that it's within TTC operating hours.

---

## Data Source

Transit data is provided by the [Transitland API](https://www.transit.land/) (operator: `o-dpz8-ttc`), which aggregates GTFS and GTFS-RT feeds published by the Toronto Transit Commission via the [City of Toronto Open Data Portal](https://open.toronto.ca/).
