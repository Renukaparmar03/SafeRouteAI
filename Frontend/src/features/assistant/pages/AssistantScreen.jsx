import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, User, Send, Mic, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { SUGGESTED_QUESTIONS, MOCK_CHAT_HISTORY } from '../../../constants/mockAssistantData';

const AssistantScreen = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(MOCK_CHAT_HISTORY);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInputValue('');

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm analyzing your request to provide the best safety recommendations...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1000);
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
          <span className="text-[10px] text-success font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-background rounded-full transition-colors active:scale-95">
            <Bell className="w-5 h-5 text-text-primary" />
          </button>
          <button className="p-2 hover:bg-background rounded-full transition-colors active:scale-95">
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
        </div>

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
                    : "bg-surface border border-border text-text-primary rounded-tl-sm shadow-sm"
                )}
              >
                {!isUser && (
                  <div className="absolute -left-2 -top-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
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
              className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary py-2 font-medium"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="p-2 -mr-1.5 text-text-secondary hover:text-primary transition-colors active:scale-95">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
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
