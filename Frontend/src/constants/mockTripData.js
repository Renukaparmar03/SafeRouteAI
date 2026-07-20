export const TRAVEL_MODES = [
  { id: 'car', label: 'Car', icon: 'Car' },
  { id: 'bike', label: 'Bike', icon: 'Bike' },
  { id: 'bus', label: 'Bus', icon: 'Bus' },
  { id: 'train', label: 'Train', icon: 'Train' },
  { id: 'walk', label: 'Walk', icon: 'Footprints' }
];

export const TRIP_TYPES = [
  { id: 'one-way', label: 'One Way' },
  { id: 'round-trip', label: 'Round Trip' }
];

export const ROUTE_PREFERENCES = [
  { id: 'safest', label: 'Safest Route', icon: 'ShieldCheck', recommended: true },
  { id: 'fastest', label: 'Fastest Route', icon: 'Zap' },
  { id: 'shortest', label: 'Shortest Route', icon: 'Clock' },
  { id: 'avoid-tolls', label: 'Avoid Tolls', icon: 'CircleOff' },
  { id: 'avoid-risk', label: 'Avoid High Risk Areas', icon: 'AlertTriangle' }
];

export const AI_RECOMMENDATION = {
  distance: '15.2 km',
  estimatedTime: '35 mins',
  riskLevel: 'Low Risk',
  weatherSummary: 'Clear skies, 24°C. Good driving conditions.',
  recommendedRoute: 'Taking Highway 101, bypassing downtown traffic and reported incidents near 5th Ave.'
};
