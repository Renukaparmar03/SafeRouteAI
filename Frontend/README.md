# SafeRoute AI — Frontend

React 19 + Vite + Tailwind mobile web app and admin portal. Full setup is in the [root README](../README.md).

```bash
npm install
cp .env.example .env   # VITE_API_URL, optional VITE_FIREBASE_* (map needs no key)
npm run dev            # http://localhost:5173
```

```
src/
├── services/      Axios instance + one service per API area, Socket.IO client, FCM push
├── context/       AuthContext, NotificationContext (socket + toasts), JourneyContext (live tracking)
├── hooks/         useGeolocation (permission-aware), useAsync
├── components/    map/MapView (Leaflet + OSM), common (states, modal, toast, place search, route guards), ui, layout
├── features/      screens by feature (auth, home, trips, map, safety, alerts, assistant, emergency, profile, admin)
├── constants/     routes, labels, static UI option lists
└── utils/         formatting helpers
```
