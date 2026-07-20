export const LABELS = {
  APP_NAME: 'SafeRoute AI',
  TAGLINE: 'Smart Travel. Safe Journey.',
  SUBTITLE: 'Your safety, our priority.',
  ONBOARDING: {
    STEP_1: {
      TITLE: 'Travel Smarter, Travel Safer',
      DESC: 'Plan your journey with AI-powered guidance, real-time safety alerts, and trusted navigation.',
    }
  },
  BUTTONS: {
    NEXT: 'Next',
    SKIP: 'Skip',
    LOGIN: 'Login',
    SIGNUP: 'Sign Up',
    GET_STARTED: 'Get Started',
    SOS: 'SOS',
  },
  PLACEHOLDERS: {
    EMAIL: 'Enter email or phone',
    PASSWORD: 'Enter password',
    SEARCH: 'Search destination or place',
  },
  ONBOARDING: {
    STEP_1: {
      TITLE: 'Travel Smarter, Travel Safer',
      DESCRIPTION: 'Plan your journey with AI-powered guidance, real-time safety alerts, and trusted navigation.',
    }
  },
  TRIP_PLANNER: {
    TITLE: 'Plan Your Trip',
    FROM: 'From',
    TO: 'To',
    DATE: 'Travel Date',
    TRAVELERS: 'Travelers',
    BUTTON: 'Find Best Route',
    PREFERENCES_TITLE: 'Choose Route Preference',
    RECOMMENDED: 'Recommended',
    DEFAULTS: {
      FROM: 'Indore, Madhya Pradesh',
      TO: 'Manali, Himachal Pradesh',
      DATE: '24 May 2025',
      TRAVELERS: '2 Travelers'
    }
  },
  TRIP_DETAILS: {
    TITLE: 'Trip Summary',
    DISTANCE: 'Distance',
    DURATION: 'Duration',
    RISK_LEVEL: 'Risk Level',
    AI_RECOMMENDATION_TITLE: 'AI Recommendation',
    AI_RECOMMENDATION_TEXT: 'This route is safe with minimal risk zones. Avoid travel after 10 PM in shaded areas.',
    START_BUTTON: 'Start Journey',
    DEFAULTS: {
      DISTANCE: '520 km',
      DURATION: '12h 45m',
      RISK: 'Medium',
    }
  },
  EMERGENCY: {
    TITLE: 'Emergency',
    BANNER: 'One Click, We are with you!',
    SUBTITLE: 'Select Emergency Type',
    TYPES: {
      HEALTH: 'Health Issue',
      POLICE: 'Police',
      AMBULANCE: 'Ambulance',
      FIRE: 'Fire',
      VEHICLE: 'Vehicle Breakdown',
      WOMEN_SAFETY: 'Women Safety',
      DISASTER: 'Natural Disaster',
      OTHERS: 'Others',
    },
    SOS_BUTTON: 'SOS',
    SOS_SUBTEXT: 'Press to Send SOS'
  },
  SOS_CONFIRM: {
    TITLE: 'SOS Alert',
    HEADING: 'Help is on the way!',
    SUBHEADING: 'Your location and emergency details have been sent.',
    DETAILS: {
      TYPE: 'Type',
      LOCATION: 'Location',
      TIME: 'Time'
    },
    CANCEL_BUTTON: 'Cancel SOS',
    DEFAULTS: {
      TYPE: 'Health Issue',
      LOCATION: '28.7041° N, 77.1025° E',
      TIME: '24 May 2025, 10:30 AM'
    }
  },
  ALERTS: {
    TITLE: 'Alerts',
    TABS: {
      ALL: 'All',
      ACTIVE: 'Active',
      PAST: 'Past'
    },
    EMPTY_STATE: 'No alerts found in this category.',
    ACTIONS: {
      MARK_READ: 'Mark as read',
      DELETE: 'Delete'
    },
    MOCK_DATA: [
      { id: 1, type: 'high_risk', title: 'High Risk Zone', desc: 'You have entered a high risk zone.', time: '10:30 AM', unread: true },
      { id: 2, type: 'stay_time', title: 'Stay Time Exceeded', desc: 'You have stayed longer than recommended time.', time: '09:45 AM', unread: true },
      { id: 3, type: 'safe_zone', title: 'Safe Zone', desc: 'You are now in safe zone.', time: '09:30 AM', unread: false },
      { id: 4, type: 'weather', title: 'Weather Alert', desc: 'Heavy rain expected in your area.', time: 'Yesterday', unread: false }
    ]
  },
  PROFILE: {
    USER: {
      NAME: 'Renuka Sharma',
      EMAIL: 'renuka@gmail.com'
    },
    MENU: {
      PERSONAL_INFO: 'Personal Information',
      EMERGENCY_CONTACTS: 'Emergency Contacts',
      TRAVEL_HISTORY: 'Travel History',
      SAVED_PLACES: 'Saved Places',
      SETTINGS: 'Settings',
      LOGOUT: 'Logout'
    }
  }
};
