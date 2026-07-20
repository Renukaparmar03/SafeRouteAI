export const SUGGESTED_QUESTIONS = [
  { id: 'q1', text: 'Is this area safe?' },
  { id: 'q2', text: 'Suggest safest route.' },
  { id: 'q3', text: 'Nearby Hospital.' },
  { id: 'q4', text: 'Weather Forecast.' },
  { id: 'q5', text: 'Packing Tips.' },
  { id: 'q6', text: 'Emergency Help.' },
];

export const MOCK_CHAT_HISTORY = [
  {
    id: 'msg1',
    sender: 'ai',
    text: 'Hello! I am your SafeRoute AI Assistant. How can I help you travel safely today?',
    timestamp: '10:00 AM'
  },
  {
    id: 'msg2',
    sender: 'user',
    text: 'I am planning a trip to downtown later tonight. Is it safe?',
    timestamp: '10:02 AM'
  },
  {
    id: 'msg3',
    sender: 'ai',
    text: 'Downtown is generally safe, but there is a medium-risk advisory for the 5th Avenue area after 10 PM due to limited lighting. I recommend taking the route via Main Street instead.',
    timestamp: '10:03 AM'
  }
];
