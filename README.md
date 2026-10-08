# SafeRoute AI

AI-powered travel safety and route assistance — MERN stack.

```
SafeRouteAI/
├── Backend/    Express + MongoDB + Socket.IO API   (Node ≥ 20, tested on 22.15)
└── Frontend/   React + Vite + Tailwind mobile web app and admin portal
```

| Area | Technology / data source |
| --- | --- |
| Map | Leaflet + OpenStreetMap tiles (no key) |
| Place search / reverse geocoding | Photon (OpenStreetMap data, no key) — or Mapbox if `MAPBOX_ACCESS_TOKEN` is set |
| Routes + turn-by-turn | OSRM on OpenStreetMap (routing.openstreetmap.de, no key) — or Mapbox Directions |
| Nearby hospitals / police / pharmacies / petrol pumps | OpenStreetMap Overpass — or Mapbox Search Box |
| Weather | Open-Meteo (no key) |
| AI assistant | Google Gemini via `@google/genai` (server side only) |
| Real time | Socket.IO (cookie-authenticated) |
| Push notifications | Firebase Cloud Messaging (Admin SDK on the server, web SDK in the browser) |
| Database | MongoDB Atlas (any MongoDB ≥ 6 works locally) |
| Geospatial | MongoDB 2dsphere indexes + Turf.js |

---

## 1. Quick start (local)

```bash
# 1) Backend
cd Backend
npm install
cp .env.example .env          # then fill in the values (see section 3)
npm run seed                  # optional: DEMO accounts, trips and DEMO risk zones
npm run dev                   # http://localhost:5000

# 2) Frontend (new terminal)
cd Frontend
npm install
cp .env.example .env          # VITE_API_URL (map needs no key)
npm run dev                   # http://localhost:5173
```

Seeded DEMO accounts (override with `SEED_*` env vars):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@saferoute.demo` | `Admin@12345` |
| User | `demo@saferoute.demo` | `Demo@12345` |

User app: `http://localhost:5173` · Admin portal: `http://localhost:5173/admin/login`

---

## 2. Third-party setup

### MongoDB Atlas
1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add your IP (or `0.0.0.0/0` for testing only).
4. **Connect → Drivers** → copy the `mongodb+srv://…` string, put the database name in the path
   (e.g. `/saferouteai`) and set it as `MONGODB_URI`.
5. If you see `querySrv ECONNREFUSED`, your DNS cannot resolve SRV records: set `MONGODB_DNS_SERVERS=8.8.8.8,8.8.4.4`.

Indexes (including the `2dsphere` index on risk-zone geometry and the TTL index on location history) are created automatically by Mongoose; `npm run seed` also syncs them.

### Maps (no key needed)
* **Map display:** Leaflet with OpenStreetMap tiles. Admin maps use the same tiles with a muted CSS filter.
* **Search / reverse geocoding:** [Photon](https://photon.komoot.io) (`PHOTON_API_URL`).
* **Routing:** [OSRM](https://routing.openstreetmap.de) (`OSRM_API_URL`), car profile for car/bike/bus/train, foot profile for walking. Turn-by-turn text is generated from OSRM maneuvers. The public OSRM server has no toll exclusion, so "Avoid Tolls" ranks routes like "Safest".
* **Nearby services:** Overpass API (`OVERPASS_API_URL`).

These public servers are free but meant for light use. For production traffic, point `VITE_MAP_TILE_URL`, `PHOTON_API_URL` and `OSRM_API_URL` at your own instances or a paid provider, and keep the OpenStreetMap attribution visible.

**Optional Mapbox upgrade:** set `MAPBOX_ACCESS_TOKEN` in `Backend/.env` and the backend uses Mapbox Geocoding, Directions (with toll avoidance) and Search Box instead. The Leaflet map stays the same.

### Google Gemini
1. Create an API key at <https://aistudio.google.com/app/apikey>.
2. Set `GEMINI_API_KEY` in `Backend/.env`. Optionally pin a model with `GEMINI_MODEL` (default `gemini-flash-latest`).

The key never reaches the browser. The assistant only states real-time facts that the backend supplies (location, weather, zones, trip, alerts, nearby services) and otherwise answers *"I don't have verified real-time information for that."*

### Firebase Cloud Messaging (browser push)
1. Create a Firebase project → **Project settings**.
2. **Service accounts → Generate new private key**. From the JSON file set in `Backend/.env`:
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` sequences).
3. **Cloud Messaging → Web Push certificates → Generate key pair** → set `FCM_WEB_VAPID_KEY` in `Backend/.env`.
4. **General → Your apps → Add web app** → copy the config into `Frontend/.env` (`VITE_FIREBASE_*`).
5. In the app: *Profile → Settings → Enable push on this device*.

Without Firebase, notifications still work in-app over Socket.IO; push is skipped and reported as not configured.

### SMS
No SMS provider is integrated. During an SOS, emergency contacts are recorded on the SOS event with status `not_sent_no_sms_provider` and shown to the user and admins (with tap-to-call numbers). Nothing is reported as "sent" unless it was.

---

## 3. Environment variables

### `Backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | API port (default `5000`) |
| `NODE_ENV` | no | `production` enables secure, cross-site cookies |
| `CLIENT_URL` | **yes** | Allowed frontend origin(s), comma-separated (CORS + Socket.IO) |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `MONGODB_DNS_SERVERS` | no | Custom DNS for Atlas SRV lookups |
| `JWT_SECRET` | **yes** | ≥ 32 random chars: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | Session length (default `7d`) |
| `ADMIN_REGISTRATION_CODE` | no | Access code required on `/admin/register`; empty disables admin sign-up |
| `PHOTON_API_URL`, `OSRM_API_URL` | no | OpenStreetMap search / routing servers (defaults: public instances) |
| `MAPBOX_ACCESS_TOKEN` | no | Optional: use Mapbox for search, routes and places |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | for AI | Gemini key / model id |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FCM_WEB_VAPID_KEY` | for push | Firebase Admin SDK + Web Push key |
| `OPEN_METEO_BASE_URL` | no | Default `https://api.open-meteo.com/v1` |
| `OVERPASS_API_URL` | no | Comma-separated Overpass mirrors |
| `ALERT_COOLDOWN_MINUTES` | no | Same-zone alert de-duplication window (default 5) |
| `NEARBY_ZONE_METERS` | no | "Zone ahead" alert distance (default 500) |
| `ROUTE_DEVIATION_METERS` | no | Off-route threshold (default 250) |
| `LOCATION_MIN_INTERVAL_SECONDS`, `LOCATION_MIN_DISTANCE_METERS` | no | Location storage throttle (default 15 s / 25 m) |
| `LOCATION_RETENTION_DAYS` | no | Location history auto-deletion (default 30) |

The server refuses to start if a required variable is missing and logs which optional integrations are not configured.

### `Frontend/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Optional; defaults to `VITE_API_URL` without `/api` |
| `VITE_MAP_TILE_URL`, `VITE_MAP_TILE_ATTRIBUTION` | Optional tile server override (default: OpenStreetMap tiles) |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Firebase web config (public identifiers) |

`.env` files are git-ignored. Only the `.env.example` files are committed.

---

## 4. Commands

| Where | Command | What it does |
| --- | --- | --- |
| Backend | `npm run dev` | API with auto-reload (nodemon) |
| Backend | `npm start` | API (production) |
| Backend | `npm run seed` | Recreates DEMO data only (never touches real records) |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Production build into `dist/` |
| Frontend | `npm run lint` | oxlint |

---

## 5. How the main flows work

**Plan Trip** → geocode From/To (Photon) → `POST /api/map/route` → OSRM (or Mapbox) routes with alternatives → risk zones along each route (2dsphere query + Turf.js) → weather at both ends (Open-Meteo) → explainable safety score per route → routes ordered by preference (safest / fastest / shortest / avoid tolls / avoid high-risk) → *Save Trip* or *Start Journey*. The server re-scores the selected route when saving.

**Live tracking** only starts after *Start Journey*: trip → `active`, then `navigator.geolocation.watchPosition` sends throttled updates over Socket.IO (`journey:location`, REST fallback). For each update the server stores a point (≤ every 15 s / 25 m), checks zones (inside / within 500 m), route deviation and weather, and raises alerts with a 5-minute de-duplication window (re-alerts if severity changes). Alerts are stored, emitted (`journey:risk-alert`, `journey:route-deviation`, `journey:notification`), and pushed via FCM. *End Journey* stops the watcher, marks the trip `completed` and stores a summary. Location history expires automatically after `LOCATION_RETENTION_DAYS`.

**Safety score** starts at 100 and subtracts listed factors: zones inside/near (weighted by level and confidence, capped), adverse weather, low visibility, strong wind, night-time, journey length, active alerts. Every factor is returned to the UI. Wording is always "lower risk based on available data" — never "safe".

**SOS** → confirmation → current location → `POST /api/emergency/sos` → SOS alert stored → admins get `sos:triggered` instantly → user gets an in-app/push confirmation → contacts recorded (no SMS without a provider) → admin can resolve; user can cancel.

**Admin notifications** → title / message / severity / target → saved per user → Socket.IO `admin:notification` → FCM push.

### Risk-zone data policy
* `OFFICIAL` — only when the dataset has a real geographic boundary. Aggregated statistics (e.g. NCRB city/district/year tables) must **not** be turned into street-level polygons.
* `ADMIN` — created by admins with source, confidence and validity period.
* `COMMUNITY` — reports, should carry lower confidence.
* `DEMO` — synthetic zones from `npm run seed`, named "DEMO Zone …", drawn with a dashed outline and labelled "DEMO data" everywhere. They are not real crime locations.

---

## 6. API reference

All endpoints return `{ success, data }` or `{ success: false, message }`. Authentication uses the HTTP-only `saferoute_token` cookie (a `Bearer` header is also accepted for API tools).

| Group | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| User | `GET /api/users/me` · `PUT /api/users/me` · `GET/POST /api/users/me/emergency-contacts` · `PUT/DELETE /api/users/me/emergency-contacts/:id` |
| Trips | `POST /api/trips` · `GET /api/trips?status=` · `GET/PUT/DELETE /api/trips/:id` · `POST /api/trips/:id/start` · `POST /api/trips/:id/end` |
| Map | `GET /api/map/search?q=` · `GET /api/map/reverse-geocode?lat=&lng=` · `POST /api/map/route` · `GET /api/map/nearby?lat=&lng=&category=` |
| Risk zones | `GET /api/risk-zones?bbox=|lat=&lng=&radius=` (GeoJSON) · `GET /api/risk-zones/nearby` · `GET /api/risk-zones/:id` |
| Safety | `GET /api/safety/check?lat=&lng=` · `GET /api/safety/forecast?lat=&lng=` |
| Weather | `GET /api/weather?lat=&lng=` |
| Alerts | `GET /api/alerts` · `PUT /api/alerts/:id/read` · `PUT /api/alerts/read-all` |
| Notifications | `GET /api/notifications` · `PUT /api/notifications/:id/read` · `PUT /api/notifications/read-all` · `DELETE /api/notifications/:id` · `GET /api/notifications/config` · `POST/DELETE /api/notifications/register-token` · `POST /api/notifications/send` (admin) |
| Tracking | `POST /api/tracking/start` · `POST /api/tracking/stop` · `POST /api/tracking/location` · `GET /api/tracking/:tripId` |
| Emergency | `GET /api/emergency/services?lat=&lng=` · `POST /api/emergency/sos` · `GET /api/emergency/sos/active` · `PUT /api/emergency/sos/:id/cancel` |
| AI | `POST /api/ai/chat` · `GET /api/ai/history` · `DELETE /api/ai/history` |
| Admin | `GET /api/admin/stats` · `GET /api/admin/system-status` · `GET /api/admin/users` · `PUT /api/admin/users/:id` · `GET /api/admin/trips` · `GET /api/admin/alerts` · `PUT /api/admin/alerts/:id/resolve` · `GET/POST /api/admin/risk-zones` · `PUT/DELETE /api/admin/risk-zones/:id` · `GET/POST /api/admin/notifications` |
| Health | `GET /api/health` |

Socket.IO events: `journey:start`, `journey:location`, `journey:risk-alert`, `journey:route-deviation`, `journey:notification`, `journey:end`, `admin:notification`, `sos:triggered`, `sos:updated`, `admin:zone-updated`. Users only join their own room; admins also join the `admins` room.

### Testing with curl

```bash
# log in and keep the session cookie
curl -c jar.txt -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"demo@saferoute.demo","password":"Demo@12345"}' \
  http://localhost:5000/api/auth/login

curl -b jar.txt "http://localhost:5000/api/weather?lat=22.7196&lng=75.8577"
curl -b jar.txt "http://localhost:5000/api/risk-zones/nearby?lat=22.7246&lng=75.8653&radius=2000"
curl -b jar.txt "http://localhost:5000/api/safety/check?lat=22.7246&lng=75.8653"
curl -b jar.txt http://localhost:5000/api/trips
```

---

## 7. Security & privacy

* Passwords hashed with bcrypt (12 rounds); JWT in an HTTP-only cookie (`secure` + `SameSite=None` in production).
* Every request body/query/param is validated with zod; keys starting with `$` or containing `.` are stripped.
* Rate limits: global, login/register, AI and third-party-backed endpoints. Helmet headers, CORS restricted to `CLIENT_URL`.
* Socket.IO connections require a valid session; users only receive their own events. Live positions are visible only to admins.
* Trips, alerts, notifications and location history are always queried by the owner's `userId`.
* Location is never requested on app start: only when a screen needs it (Explore Map "locate me", Safety Check, Plan Trip "use my location", SOS) or after *Start Journey*.

---

## 8. Common errors

| Symptom | Fix |
| --- | --- |
| `Missing required environment variables` on start | Copy `.env.example` to `.env` and fill `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`. |
| `querySrv ECONNREFUSED` / `ENOTFOUND` | Set `MONGODB_DNS_SERVERS=8.8.8.8,8.8.4.4`, check Atlas Network Access. |
| `MongoServerError: bad auth` | Wrong DB user/password in `MONGODB_URI` (URL-encode special characters). |
| Login works but every request is 401 | Frontend origin must exactly match `CLIENT_URL`; use `http://localhost:5173`, not `127.0.0.1`. In production, serve both over HTTPS. |
| Grey map / tiles not loading | Check internet access to `tile.openstreetmap.org` (or your `VITE_MAP_TILE_URL`). |
| Search or routes return 502 | The public Photon/OSRM server is busy or unreachable — retry, or set your own `PHOTON_API_URL` / `OSRM_API_URL`, or a `MAPBOX_ACCESS_TOKEN`. |
| "No route found" | OSRM could not connect the two points by road (e.g. different islands); pick places on the road network. |
| AI replies "not configured" | Set `GEMINI_API_KEY`; if it says it could not authenticate, check the key and `GEMINI_MODEL`. |
| Location permission errors | Allow location in the browser. Geolocation only works on `https://` or `localhost`. |
| Push not arriving | All Firebase variables set on both sides, permission granted, and the device registered in *Profile → Settings*. |
| Nearby services empty | Overpass mirrors can be busy; retry or configure Mapbox. |
