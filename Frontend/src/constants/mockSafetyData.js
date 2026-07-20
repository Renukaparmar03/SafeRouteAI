export const SAFETY_MOCK_DATA = {
  currentStatus: {
    label: 'Safe Zone',
    score: 92,
    statusLevel: 'Excellent',
    description: 'You are currently in a well-lit, heavily populated area with active police patrolling.'
  },
  aiRecommendations: [
    { id: 1, text: 'Stay on the main routes', icon: 'Map' },
    { id: 2, text: 'Avoid 5th Avenue Alley after dark', icon: 'AlertCircle' },
    { id: 3, text: 'Consider a cab if traveling past midnight', icon: 'Car' }
  ],
  weatherSummary: {
    temperature: '26°C',
    condition: 'Clear skies',
    rainProbability: '10%'
  },
  roadAlertsSummary: {
    count: 2,
    shortSummary: 'Road closed on Main St.'
  },
  riskZones: [
    { id: 1, name: '5th Avenue Alley', distance: '1.2 km away', type: 'High Risk', reason: 'Low lighting, recent incidents' },
    { id: 2, name: 'Old Bridge Road', distance: '3.5 km away', type: 'Moderate Risk', reason: 'Construction, uneven terrain' }
  ],
  emergencyServices: [
    { id: 'hospital', label: 'Hospital', icon: 'Cross', distance: '2.5 km' },
    { id: 'police', label: 'Police Station', icon: 'Shield', distance: '1.8 km' },
    { id: 'pharmacy', label: 'Pharmacy', icon: 'Pill', distance: '0.5 km' },
    { id: 'petrol', label: 'Petrol Pump', icon: 'Fuel', distance: '3.2 km' }
  ],
  dailySummary: [
    { id: 'morning', time: 'Morning', status: 'Excellent', color: 'bg-success text-white' },
    { id: 'afternoon', time: 'Afternoon', status: 'Good', color: 'bg-[#10B981] text-white' },
    { id: 'evening', time: 'Evening', status: 'Moderate', color: 'bg-warning text-white' },
    { id: 'night', time: 'Night', status: 'High Risk', color: 'bg-danger text-white' }
  ]
};
