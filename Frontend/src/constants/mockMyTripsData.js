export const MOCK_TRIPS = [
  {
    id: 't1',
    status: 'upcoming',
    source: 'Indore',
    destination: 'Manali',
    date: '24 May 2026',
    travelers: '2 Travelers',
    mode: 'Car',
    riskLevel: 'Low Risk',
    riskScore: '95/100',
    eta: '12hr 30m',
    image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?auto=format&fit=crop&q=80&w=400',
    aiInsights: ['Clear weather ahead', 'Recommended route active']
  },
  {
    id: 't2',
    status: 'ongoing',
    source: 'Delhi',
    destination: 'Shimla',
    date: '19 May 2026',
    travelers: '4 Travelers',
    mode: 'Car',
    riskLevel: 'Moderate',
    riskScore: '75/100',
    eta: '8hr 15m',
    image: 'https://images.unsplash.com/photo-1593181696013-1b9c9f2b84eb?auto=format&fit=crop&q=80&w=400',
    aiInsights: ['Light rain expected', 'Traffic build-up near Sector 4']
  },
  {
    id: 't3',
    status: 'completed',
    source: 'Indore',
    destination: 'Udaipur',
    date: '10 May 2026',
    travelers: '3 Travelers',
    mode: 'Car',
    riskLevel: 'Safe',
    riskScore: '98/100',
    eta: '6hr 20m',
    image: 'https://images.unsplash.com/photo-1590766129851-7f98fb9547ea?auto=format&fit=crop&q=80&w=400',
    aiInsights: ['Trip completed safely', 'No incidents reported']
  }
];

export const TRIP_TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];
