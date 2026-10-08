# SafeRoute AI — Backend

Express 5 + MongoDB (Mongoose) + Socket.IO API. Full setup, environment variables, API reference and troubleshooting are in the [root README](../README.md).

```bash
npm install
cp .env.example .env   # fill MONGODB_URI, JWT_SECRET, CLIENT_URL (+ optional integrations)
npm run seed           # DEMO data
npm run dev            # http://localhost:5000
```

```
src/
├── config/        env validation, MongoDB, Firebase Admin
├── models/        User, Trip, RiskZone, Alert, Notification, EmergencyContact, LocationPoint, AIConversation
├── controllers/   request handlers (thin)
├── routes/        Express routers (validation + auth per route)
├── middleware/    auth, admin, zod validation/sanitising, rate limiting, errors
├── services/      map (OSM: Photon/OSRM/Overpass, optional Mapbox), weather (Open-Meteo), risk scoring, route analysis,
│                  tracking, notifications (Socket.IO + FCM), AI (Gemini)
├── sockets/       authenticated Socket.IO server + emitter
├── utils/         geo (Turf.js), tokens, serializers, cache
├── validators/    zod schemas
├── seed/          DEMO seed script
├── app.js
└── server.js
```
