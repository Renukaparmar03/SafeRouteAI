import { getWeather } from '../services/weatherService.js';
import { sendSuccess } from '../utils/responseUtils.js';

// GET /api/weather?lat=&lng=
export const weather = async (req, res) => {
  const { lat, lng } = req.valid.query;
  const data = await getWeather({ lat, lng });
  const { todayHourly: _internal, ...publicData } = data;
  sendSuccess(res, publicData);
};
