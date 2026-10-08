import { env } from '../config/env.js';
import { ApiError } from '../utils/responseUtils.js';
import { createCache, fetchJson } from '../utils/cache.js';

const weatherCache = createCache(10 * 60 * 1000);

// WMO weather interpretation codes used by Open-Meteo.
const WMO = {
  0: ['Clear sky', '☀️'],
  1: ['Mainly clear', '🌤️'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'],
  48: ['Depositing rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'],
  53: ['Drizzle', '🌦️'],
  55: ['Dense drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'],
  57: ['Dense freezing drizzle', '🌧️'],
  61: ['Light rain', '🌦️'],
  63: ['Rain', '🌧️'],
  65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'],
  67: ['Heavy freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'],
  73: ['Snow', '🌨️'],
  75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '🌨️'],
  80: ['Light showers', '🌦️'],
  81: ['Showers', '🌧️'],
  82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'],
  96: ['Thunderstorm with hail', '⛈️'],
  99: ['Severe thunderstorm with hail', '⛈️'],
};

export const describeWeatherCode = (code) => {
  const [condition, icon] = WMO[code] || ['Unknown', '🌡️'];
  return { condition, icon };
};

/** Severity of a weather code for travel: 0 (none) – 3 (severe). */
export const weatherCodeSeverity = (code) => {
  if ([95, 96, 99, 82, 75, 86, 67].includes(code)) return 3;
  if ([65, 63, 81, 73, 66, 57, 56, 45, 48].includes(code)) return 2;
  if ([61, 80, 71, 77, 85, 51, 53, 55].includes(code)) return 1;
  return 0;
};

const currentHourIndex = (times, utcOffsetSeconds) => {
  // Open-Meteo returns local times without offset; compare in the location's local time.
  const nowLocal = new Date(Date.now() + utcOffsetSeconds * 1000).toISOString().slice(0, 13);
  const idx = times.findIndex((t) => t.slice(0, 13) === nowLocal);
  return idx >= 0 ? idx : 0;
};

/**
 * Current, hourly (next 24 h) and daily (3 days) weather for coordinates.
 */
export const getWeather = async ({ lat, lng }) => {
  const key = `${lat.toFixed(2)}|${lng.toFixed(2)}`;
  const cached = weatherCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,rain,wind_speed_10m,is_day',
    hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    timezone: 'auto',
    forecast_days: '3',
  });

  let data;
  try {
    data = await fetchJson(`${env.openMeteoBaseUrl}/forecast?${params}`, { service: 'Open-Meteo' });
  } catch (error) {
    throw new ApiError(502, 'Weather data is currently unavailable.');
  }

  const offset = data.utc_offset_seconds || 0;
  const h = data.hourly || {};
  const nowIdx = currentHourIndex(h.time || [], offset);
  const c = data.current || {};

  const hourly = (h.time || []).slice(nowIdx, nowIdx + 24).map((time, i) => {
    const idx = nowIdx + i;
    return {
      time,
      temperature: h.temperature_2m?.[idx],
      precipitationProbability: h.precipitation_probability?.[idx],
      precipitation: h.precipitation?.[idx],
      weatherCode: h.weather_code?.[idx],
      visibility: h.visibility?.[idx],
      windSpeed: h.wind_speed_10m?.[idx],
      isDay: h.is_day?.[idx] === 1,
      ...describeWeatherCode(h.weather_code?.[idx]),
    };
  });

  const d = data.daily || {};
  const daily = (d.time || []).map((date, i) => ({
    date,
    weatherCode: d.weather_code?.[i],
    temperatureMax: d.temperature_2m_max?.[i],
    temperatureMin: d.temperature_2m_min?.[i],
    precipitationProbabilityMax: d.precipitation_probability_max?.[i],
    sunrise: d.sunrise?.[i],
    sunset: d.sunset?.[i],
    ...describeWeatherCode(d.weather_code?.[i]),
  }));

  // Today's full hourly series (00:00–23:00 local) for the safety forecast slots.
  const todayDate = daily[0]?.date;
  const todayHourly = (h.time || [])
    .map((time, idx) => ({
      hour: Number(time.slice(11, 13)),
      date: time.slice(0, 10),
      weatherCode: h.weather_code?.[idx],
      precipitationProbability: h.precipitation_probability?.[idx],
      visibility: h.visibility?.[idx],
      windSpeed: h.wind_speed_10m?.[idx],
      isDay: h.is_day?.[idx] === 1,
    }))
    .filter((row) => row.date === todayDate);

  const result = {
    location: { latitude: data.latitude, longitude: data.longitude, timezone: data.timezone, utcOffsetSeconds: offset },
    current: {
      time: c.time,
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      weatherCode: c.weather_code,
      precipitation: c.precipitation,
      rain: c.rain,
      windSpeed: c.wind_speed_10m,
      isDay: c.is_day === 1,
      precipitationProbability: h.precipitation_probability?.[nowIdx] ?? null,
      visibility: h.visibility?.[nowIdx] ?? null,
      ...describeWeatherCode(c.weather_code),
    },
    hourly,
    daily,
    todayHourly,
    units: { temperature: '°C', windSpeed: 'km/h', precipitation: 'mm', visibility: 'm' },
    source: 'Open-Meteo',
    fetchedAt: new Date().toISOString(),
  };
  return weatherCache.set(key, result);
};

/** Short human summary, e.g. "Light rain, 24°C. 60% chance of rain." */
export const summarizeWeather = (weather) => {
  if (!weather?.current) return null;
  const c = weather.current;
  const parts = [`${c.condition}, ${Math.round(c.temperature)}°C`];
  if (Number.isFinite(c.precipitationProbability)) parts.push(`${c.precipitationProbability}% chance of rain`);
  if (Number.isFinite(c.windSpeed) && c.windSpeed >= 30) parts.push(`wind ${Math.round(c.windSpeed)} km/h`);
  return `${parts.join('. ')}.`;
};

/** Weather-derived travel warnings (not road-closure data). */
export const weatherWarnings = (weather) => {
  if (!weather?.current) return [];
  const c = weather.current;
  const warnings = [];
  const severity = weatherCodeSeverity(c.weatherCode);
  if (severity >= 3) warnings.push({ severity: 'HIGH', message: `${c.condition} — consider delaying travel.` });
  else if (severity === 2) warnings.push({ severity: 'MEDIUM', message: `${c.condition} may reduce road grip and visibility.` });
  if (Number.isFinite(c.visibility) && c.visibility < 1000) {
    warnings.push({ severity: 'MEDIUM', message: `Low visibility (${Math.round(c.visibility)} m).` });
  }
  if (Number.isFinite(c.windSpeed) && c.windSpeed >= 50) {
    warnings.push({ severity: 'MEDIUM', message: `Strong winds (${Math.round(c.windSpeed)} km/h).` });
  }
  if (Number.isFinite(c.precipitationProbability) && c.precipitationProbability >= 70 && severity < 2) {
    warnings.push({ severity: 'LOW', message: `High chance of rain (${c.precipitationProbability}%).` });
  }
  return warnings;
};
