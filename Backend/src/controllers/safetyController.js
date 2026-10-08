import Notification from '../models/Notification.js';
import { sendSuccess } from '../utils/responseUtils.js';
import { getWeather, summarizeWeather, weatherCodeSeverity, weatherWarnings } from '../services/weatherService.js';
import { DISCLAIMER, findZonesNear, forecastSlots, maxLevel, resolveIsNight, scoreLocation } from '../services/riskService.js';
import { reverseGeocode } from '../services/mapService.js';

const safe = async (promise) => {
  try {
    return await promise;
  } catch {
    return null;
  }
};

const areaLabel = (zones, riskLevel) => {
  const inside = zones.find((z) => z.distance === 0);
  if (inside) return `Inside ${inside.riskLevel === 'HIGH' ? 'High' : inside.riskLevel === 'MEDIUM' ? 'Medium' : 'Low'}-Risk Zone`;
  return riskLevel === 'LOW' ? 'Lower-Risk Area' : riskLevel === 'MEDIUM' ? 'Medium-Risk Area' : 'High-Risk Area';
};

const describe = ({ zones, weather, isNight }) => {
  const parts = [];
  const within2km = zones.filter((z) => z.distance <= 2000);
  if (!within2km.length) parts.push('No mapped risk zones within 2 km.');
  else {
    const high = within2km.filter((z) => z.riskLevel === 'HIGH').length;
    parts.push(`${within2km.length} mapped risk zone${within2km.length > 1 ? 's' : ''} within 2 km${high ? ` (${high} high-risk)` : ''}.`);
  }
  if (weather) parts.push(summarizeWeather(weather));
  if (isNight) parts.push('It is currently night-time.');
  parts.push(DISCLAIMER);
  return parts.join(' ');
};

const buildAdvice = ({ zones, weather, isNight }) => {
  const advice = [];
  const worst = zones.find((z) => z.riskLevel === 'HIGH') || zones.find((z) => z.riskLevel === 'MEDIUM');
  if (worst) advice.push({ id: 'zone', text: `Avoid ${worst.name} (${worst.riskLevel.toLowerCase()} risk${worst.isDemo ? ', demo data' : ''}) where possible`, icon: 'AlertCircle' });
  if (isNight) advice.push({ id: 'night', text: 'Prefer well-lit main roads and avoid isolated shortcuts at night', icon: 'Map' });
  const severity = weatherCodeSeverity(weather?.current?.weatherCode);
  if (severity >= 2) advice.push({ id: 'weather', text: `${weather.current.condition}: reduce speed and keep extra distance`, icon: 'Car' });
  else if ((weather?.current?.precipitationProbability ?? 0) >= 50) advice.push({ id: 'rain', text: 'Rain is likely — carry rain protection', icon: 'Car' });
  advice.push({ id: 'contacts', text: 'Share your trip with an emergency contact before you travel', icon: 'Info' });
  if (advice.length < 3) advice.push({ id: 'sos', text: 'Keep the SOS button handy; it sends your live location instantly', icon: 'AlertCircle' });
  return advice.slice(0, 3);
};

// GET /api/safety/check?lat=&lng=
export const check = async (req, res) => {
  const { lat, lng } = req.valid.query;
  const [weather, place, recentAlerts] = await Promise.all([
    safe(getWeather({ lat, lng })),
    safe(reverseGeocode({ lat, lng })),
    Notification.find({
      userId: req.user._id,
      type: { $in: ['ADMIN_ALERT', 'WEATHER_ALERT'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);
  const isNight = resolveIsNight(weather);
  const zones = await findZonesNear({ lat, lng, radius: 5000, isNight });

  const warnings = weatherWarnings(weather);
  const roadItems = [
    ...warnings.map((w) => ({ source: 'Weather (Open-Meteo)', severity: w.severity, message: w.message })),
    ...recentAlerts.map((n) => ({ source: n.type === 'ADMIN_ALERT' ? 'Admin safety alert' : 'Weather alert', severity: n.severity, message: n.title })),
  ];

  const scored = scoreLocation({ zones, weather, isNight, activeAlerts: roadItems });
  // Being inside a zone sets a floor on the level, whatever the overall score says.
  const insideLevel = zones.filter((z) => z.distance === 0).reduce((lvl, z) => maxLevel(lvl, z.riskLevel), 'LOW');
  scored.riskLevel = maxLevel(scored.riskLevel, insideLevel);

  sendSuccess(res, {
    location: { latitude: lat, longitude: lng, name: place?.shortName || null },
    score: scored.score,
    riskLevel: scored.riskLevel,
    status: scored.status,
    label: areaLabel(zones, scored.riskLevel),
    description: describe({ zones, weather, isNight }),
    factors: scored.factors,
    isNight,
    weather: weather
      ? {
          temperature: weather.current.temperature,
          feelsLike: weather.current.feelsLike,
          condition: weather.current.condition,
          icon: weather.current.icon,
          precipitationProbability: weather.current.precipitationProbability,
          windSpeed: weather.current.windSpeed,
          visibility: weather.current.visibility,
        }
      : null,
    roadAlerts: {
      count: roadItems.length,
      items: roadItems,
      summary: roadItems[0]?.message || 'No active road or weather alerts.',
      note: 'Live road-closure data is not available; alerts come from weather data and admin notices.',
    },
    riskZones: zones.map(({ geometry: _g, ...z }) => z),
    forecast: forecastSlots({ weather, zones }),
    advice: buildAdvice({ zones, weather, isNight }),
    disclaimer: DISCLAIMER,
  });
};

// GET /api/safety/forecast?lat=&lng=
export const forecast = async (req, res) => {
  const { lat, lng } = req.valid.query;
  const weather = await safe(getWeather({ lat, lng }));
  const zones = await findZonesNear({ lat, lng, radius: 5000, includeAllHours: true });
  sendSuccess(res, {
    slots: forecastSlots({ weather, zones }),
    hourly: weather?.hourly || [],
    weatherAvailable: Boolean(weather),
    disclaimer: DISCLAIMER,
  });
};
