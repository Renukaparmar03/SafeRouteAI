export const MOCK_MAP_MARKERS = [
  {
    id: 'current-location',
    type: 'current',
    lat: 37.7749,
    lng: -122.4194,
    color: 'bg-primary',
    label: 'You are here'
  },
  {
    id: 'safe-zone-1',
    type: 'safe',
    lat: 37.7799,
    lng: -122.4100,
    color: 'bg-success',
    label: 'Safe Zone'
  },
  {
    id: 'medium-risk-1',
    type: 'medium',
    lat: 37.7720,
    lng: -122.4250,
    color: 'bg-warning',
    label: 'Medium Risk'
  },
  {
    id: 'high-risk-1',
    type: 'high',
    lat: 37.7850,
    lng: -122.4050,
    color: 'bg-danger',
    label: 'High Risk'
  }
];

export const MOCK_ROUTE_DETAILS = {
  currentLocation: '123 Market St, San Francisco, CA',
  destination: 'Golden Gate Bridge, San Francisco, CA',
  distance: '4.2 miles',
  estimatedTime: '15 mins',
  riskLevel: 'Low Risk',
  riskColor: 'text-success',
  aiRecommendation: 'Taking the safest route via Lombard St. Avoiding reported incidents on Highway 101.',
};
