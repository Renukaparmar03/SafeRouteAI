// Static UI option lists (labels/icons). Dynamic data comes from the API.
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

// My Trips tabs → backend trip statuses
export const TRIP_TABS = [
  { id: 'planned', label: 'Upcoming' },
  { id: 'active', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];

export const TRAVEL_MODE_LABEL = Object.fromEntries(TRAVEL_MODES.map((m) => [m.id, m.label]));

export const SUGGESTED_QUESTIONS = [
  { id: 'q1', text: 'Is this area safe?' },
  { id: 'q2', text: 'Suggest safest route.' },
  { id: 'q3', text: 'Nearby Hospital.' },
  { id: 'q4', text: 'Weather Forecast.' },
  { id: 'q5', text: 'Packing Tips.' },
  { id: 'q6', text: 'Emergency Help.' },
];
