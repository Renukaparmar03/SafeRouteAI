import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, Send, Mic, Sparkles, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { SUGGESTED_QUESTIONS } from '../../../constants/tripOptions';
import { ROUTES } from '../../../constants/routes';
import { aiService } from '../../../services/aiService';
import { useJourney } from '../../../context/JourneyContext';
import { useNotifications } from '../../../context/NotificationContext';
import { getCurrentPosition, getPermissionState } from '../../../hooks/useGeolocation';
import { LoadingState } from '../../../components/common/StateViews';
import { formatTime } from '../../../utils/format';

const toBubble = (m) => ({
  id: m.id,
  sender: m.role === 'assistant' ? 'ai' : 'user',
  text: m.content,
  timestamp: formatTime(m.createdAt),
});

const AssistantScreen = () => {
  const navigate = useNavigate();
  const journey = useJourney();
  const { unreadCount, connected } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [historyStatus, setHistoryStatus] = useState('loading');
  const [conversationId, setConversationId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const positionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  useEffect(() => {
    aiService
      .history()
      .then((data) => {
        setConversationId(data.conversationId);
        setMessages(data.messages.map(toBubble));
        setHistoryStatus('success');
      })
      .catch(() => setHistoryStatus('error'));
  }, []);

  // Location is attached only when available; the user is asked at the moment they send a question.
  const resolvePosition = async () => {
    if (journey.position) return journey.position;
    if (positionRef.current) return positionRef.current;
    const state = await getPermissionState();
    if (state === 'denied') return null;
    try {
      positionRef.current = await getCurrentPosition({ timeout: 8000 });
      return positionRef.current;
    } catch {
      return null;
    }
  };

  const handleSendMessage = async (text = inputValue) => {
    const message = text.trim();
    if (!message || sending) return;

    // Add user message
    const pendingId = `pending-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: pendingId, sender: 'user', text: message, timestamp: formatTime(new Date()) },
    ]);
    setInputValue('');
    setSending(true);

    try {
      const position = await resolvePosition();
      const data = await aiService.chat({
        message,
        conversationId,
        tripId: journey.trip?.id,
        latitude: position?.latitude,
        longitude: position?.longitude,
      });
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev.filter((m) => m.id !== pendingId), toBubble(data.userMessage), toBubble(data.reply)]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `error-${Date.now()}`, sender: 'ai', text: error.message, timestamp: formatTime(new Date()), isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!messages.length || !window.confirm('Clear your conversation with the assistant?')) return;
    try {
      await aiService.clear();
      setMessages([]);
      setConversationId(null);
    } catch (error) {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, sender: 'ai', text: error.message, timestamp: formatTime(new Date()), isError: true }]);
    }
  };

  const handleVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, sender: 'ai', text: 'Voice input is not supported in this browser.', timestamp: formatTime(new Date()), isError: true }]);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.onresult = (e) => setInputValue(e.results[0][0].transcript);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-surface border-b border-border shadow-sm z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-background rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold text-text-primary tracking-wide">AI Assistant</h1>
          <span className={clsx('text-[10px] font-medium flex items-center gap-1', connected ? 'text-success' : 'text-text-secondary')}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-success animate-pulse' : 'bg-text-secondary')} /> {connected ? 'Online' : 'Connecting…'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(ROUTES.ALERTS)} className="relative p-2 hover:bg-background rounded-full transition-colors active:scale-95">
            <Bell className="w-5 h-5 text-text-primary" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white" />}
          </button>
          <button onClick={() => navigate(ROUTES.PROFILE)} className="p-2 hover:bg-background rounded-full transition-colors active:scale-95">
            <User className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[160px] scrollbar-hide flex flex-col gap-6">
        {/* Welcome Message */}
        <div className="flex flex-col items-center justify-center py-6 mb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-1">SafeRoute AI</h2>
          <p className="text-sm text-text-secondary text-center px-4 leading-relaxed font-medium">
            Your personal AI travel companion. Ask me anything about routes, safety, and local tips.
          </p>
          {journey.trip && (
            <p className="text-[11px] text-primary font-bold mt-2">Using your active trip to {journey.trip.destination.name.split(',')[0]}</p>
          )}
          {messages.length > 0 && (
            <button onClick={handleClear} className="mt-3 text-[11px] font-bold text-text-secondary flex items-center gap-1 hover:text-danger">
              <Trash2 className="w-3 h-3" /> Clear conversation
            </button>
          )}
        </div>

        {historyStatus === 'loading' && <LoadingState label="Loading conversation…" className="py-2" />}

        {/* Message List */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={clsx(
                "flex w-full",
                isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={clsx(
                  "max-w-[80%] p-4 rounded-2xl relative",
                  isUser
                    ? "bg-primary text-white rounded-tr-sm shadow-md shadow-primary/20"
                    : "bg-surface border border-border text-text-primary rounded-tl-sm shadow-sm",
                  msg.isError && "border-danger/30 bg-danger/5"
                )}
              >
                {!isUser && (
                  <div className="absolute -left-2 -top-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <p className={clsx('text-sm leading-relaxed font-medium whitespace-pre-line', msg.isError && 'text-danger')}>{msg.text}</p>
                <span
                  className={clsx(
                    "text-[10px] block mt-2 font-bold uppercase tracking-wider",
                    isUser ? "text-white/70 text-right" : "text-text-secondary text-left"
                  )}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex w-full justify-start">
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border z-30 pb-4">
        {/* Suggested Questions */}
        <div className="px-4 py-3 overflow-x-auto scrollbar-hide flex gap-2 border-b border-border/50">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => setInputValue(q.text)}
              className="whitespace-nowrap px-4 py-2 bg-background border border-border rounded-full text-[11px] font-bold text-text-primary hover:border-primary hover:text-primary transition-colors active:scale-95 shadow-sm"
            >
              {q.text}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="p-4 flex items-end gap-3">
          <div className="flex-1 bg-background border border-border rounded-3xl flex items-center px-4 py-1.5 shadow-inner transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            <input
              type="text"
              placeholder="Ask anything..."
              maxLength={2000}
              className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary py-2 font-medium"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleVoice} className="p-2 -mr-1.5 text-text-secondary hover:text-primary transition-colors active:scale-95">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || sending}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-all active:scale-95"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantScreen;
