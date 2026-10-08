import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import Trip from '../models/Trip.js';
import Alert from '../models/Alert.js';
import RiskZone from '../models/RiskZone.js';
import { ApiError, serviceUnavailable } from '../utils/responseUtils.js';
import { formatDistance, formatDuration } from '../utils/geoUtils.js';
import { getWeather, summarizeWeather } from './weatherService.js';
import { findZonesNear, resolveIsNight } from './riskService.js';
import { findNearbyServices, reverseGeocode } from './mapService.js';

let client = null;
const getClient = () => {
  if (!env.geminiApiKey) {
    throw serviceUnavailable('AI assistant is not configured. Add GEMINI_API_KEY to Backend/.env.');
  }
  if (!client) client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
};

export const NO_DATA_PHRASE = "I don't have verified real-time information for that.";

const SYSTEM_INSTRUCTION = `You are SafeRoute AI, a travel-safety assistant inside the SafeRoute AI app.

Rules you must follow:
1. Real-time facts (weather, risk zones, alerts, routes, nearby services, the user's trip) may ONLY come from the CONTEXT block supplied with each message. Never invent them.
2. If the user asks for real-time information that is not in CONTEXT, say exactly: "${NO_DATA_PHRASE}" and then give general, clearly-labelled advice if useful.
3. Never claim police presence, patrols, crime incidents, road closures, protests, accidents or emergency events unless they appear in CONTEXT.
4. Risk zones whose source is DEMO are synthetic development data, not real crime locations. If you mention one, say it is demo data.
5. Never say a route or area is "safe" or "guaranteed safe". Use wording such as "lower risk based on available data".
6. For emergencies, tell the user to use the SOS button in the app and call the local emergency number (112 in India).
7. Be concise (under 160 words), practical and friendly. Use short bullet points when listing.`;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]).catch(() => null);

/** Collects verified data for the assistant from the database and APIs. */
export const buildContext = async ({ user, tripId, latitude, longitude }) => {
  const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
  const trip = tripId
    ? await Trip.findOne({ _id: tripId, userId: user._id }).lean()
    : await Trip.findOne({ userId: user._id, status: 'active' }).lean();

  const [weatherHere, place, zonesHere, services, destinationWeather, alerts, routeZones] = await Promise.all([
    hasLocation ? withTimeout(getWeather({ lat: latitude, lng: longitude }), 8000) : null,
    hasLocation ? withTimeout(reverseGeocode({ lat: latitude, lng: longitude }), 5000) : null,
    hasLocation ? findZonesNear({ lat: latitude, lng: longitude, radius: 5000, includeAllHours: true }) : [],
    hasLocation ? withTimeout(findNearbyServices({ lat: latitude, lng: longitude, limit: 2 }), 8000) : null,
    trip ? withTimeout(getWeather({ lat: trip.destination.latitude, lng: trip.destination.longitude }), 8000) : null,
    Alert.find({ userId: user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    trip?.selectedRoute?.riskZoneIds?.length
      ? RiskZone.find({ _id: { $in: trip.selectedRoute.riskZoneIds } }).select('name riskLevel sourceType').lean()
      : [],
  ]);

  const lines = [`Current time (server): ${new Date().toISOString()}`, `User name: ${user.name}`];

  if (hasLocation) {
    lines.push(`User location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${place?.shortName ? ` (${place.shortName})` : ''}`);
  } else {
    lines.push('User location: not shared');
  }

  if (weatherHere) {
    lines.push(`Weather at user location (Open-Meteo): ${summarizeWeather(weatherHere)} Feels like ${Math.round(weatherHere.current.feelsLike)}°C. ${resolveIsNight(weatherHere) ? 'It is night-time.' : 'It is daytime.'}`);
  } else if (hasLocation) {
    lines.push('Weather at user location: unavailable');
  }

  if (hasLocation) {
    if (zonesHere.length) {
      lines.push('Mapped risk zones within 5 km:');
      zonesHere.slice(0, 6).forEach((z) =>
        lines.push(`- ${z.name}: ${z.riskLevel} risk, ${z.distanceText}, source ${z.sourceType}${z.sourceName ? ` (${z.sourceName})` : ''}, confidence ${Math.round((z.confidence ?? 0) * 100)}%${z.activeHours !== 'ALWAYS' ? `, applies ${z.activeHours.toLowerCase()} only` : ''}. ${z.description || ''}`)
      );
    } else {
      lines.push('Mapped risk zones within 5 km: none in the database.');
    }
  }

  if (services?.categories) {
    const svcLines = Object.values(services.categories)
      .flat()
      .map((s) => `- ${s.categoryLabel}: ${s.name}, ${s.distanceText}${s.address ? `, ${s.address}` : ''}`);
    lines.push(svcLines.length ? `Nearby emergency services:\n${svcLines.join('\n')}` : 'Nearby emergency services: none found.');
  }

  if (trip) {
    lines.push(
      `Trip (${trip.status}): ${trip.from.name} → ${trip.destination.name}, travel date ${new Date(trip.travelDate).toDateString()}, ${trip.travelers} traveller(s), mode ${trip.travelMode}, preference ${trip.routePreference}.`
    );
    if (trip.selectedRoute) {
      const r = trip.selectedRoute;
      lines.push(`Planned route: ${formatDistance(r.distance)}, about ${formatDuration(r.duration)}, safety score ${r.safetyScore}/100 (${r.riskLevel} risk). ${r.recommendation || ''}`);
      if (r.factors?.length) lines.push(`Score factors: ${r.factors.map((f) => `${f.label} (${f.impact})`).join('; ')}`);
    }
    if (routeZones?.length) {
      lines.push(`Risk zones along the route: ${routeZones.map((z) => `${z.name} (${z.riskLevel}, ${z.sourceType})`).join('; ')}`);
    }
    lines.push(destinationWeather ? `Weather at destination: ${summarizeWeather(destinationWeather)}` : 'Weather at destination: unavailable');
  } else {
    lines.push('Trip: no active or selected trip.');
  }

  lines.push(
    alerts.length
      ? `User alerts in the last 24 h:\n${alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.message}`).join('\n')}`
      : 'User alerts in the last 24 h: none.'
  );
  lines.push('Not available from any trusted source: police presence, crime reports, road closures, traffic incidents.');

  return {
    text: lines.join('\n'),
    trip,
    used: {
      location: hasLocation,
      weather: Boolean(weatherHere),
      riskZones: zonesHere.length,
      trip: Boolean(trip),
      emergencyServices: Boolean(services?.categories),
    },
  };
};

/** Sends the conversation plus verified context to Gemini and returns the reply text. */
export const generateReply = async ({ history, message, contextText }) => {
  const ai = getClient();
  const contents = [
    ...history.slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: `CONTEXT (verified app data):\n${contextText}\n\nUSER QUESTION:\n${message}` }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.3, maxOutputTokens: 600 },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  } catch (error) {
    const status = error.status || error.code;
    console.error(`[ai] Gemini request failed: ${error.message}`);
    if (status === 400 || status === 401 || status === 403) {
      throw serviceUnavailable('AI assistant could not authenticate with Gemini. Check GEMINI_API_KEY and GEMINI_MODEL.');
    }
    if (status === 429) throw new ApiError(429, 'AI assistant is busy. Please try again in a minute.');
    throw new ApiError(502, 'AI assistant is temporarily unavailable. Please try again.');
  }
};
