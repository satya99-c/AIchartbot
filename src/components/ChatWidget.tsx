import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, AlertCircle, ShieldAlert, ZapOff, RefreshCw } from 'lucide-react';
import { ChatMessage, SimulationConfig } from '../types';

interface ChatWidgetProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  simulationConfig: SimulationConfig;
  onNewMessageLogged: (message: string, reply: ChatMessage) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ChatWidget({ isLoggedIn, setIsLoggedIn, simulationConfig, onNewMessageLogged, isOpen, setIsOpen }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Welcome to the **VitalitySoft Vessel Intelligence Hub!** (e.g. *where was Vitality Sea June 10-15*)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setInputValue('');
    
    const userMsgId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // POST directly to our middleware /api/chat inside the server
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          simulateConfig: simulationConfig,
          isLoggedIn: isLoggedIn
        })
      });

      const data = await res.json();
      setIsTyping(false);

      const botReply: ChatMessage & { loginRequired?: boolean } = {
        id: Date.now().toString() + '-bot',
        sender: 'bot',
        text: data.response || "No response received.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        confidence: data.confidence,
        apigeeStatus: data.apigeeTrace ? { status: res.status, errorCode: data.apigeeTrace.errorCode || 'passed', faultString: data.apigeeTrace.faultString } : undefined,
        apigeeTrace: data.apigeeTrace,
        backendData: data.backendData,
        traceLogs: data.traceLogs || [],
        loginRequired: data.loginRequired
      };

      setMessages((prev) => [...prev, botReply]);
      
      // Feed telemetry logs to developer console
      onNewMessageLogged(query, botReply);

    } catch (err: any) {
      setIsTyping(false);
      const networkErrorMsg: ChatMessage = {
        id: Date.now().toString() + '-err',
        sender: 'system',
        text: `⚠️ **Middleware Handshake Timeout**: Failed to communicate with Express server. Host socket could be rebuilding.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, networkErrorMsg]);
    }
  };

  const renderMessageContent = (text: string) => {
    // Converts bold **text** to HTML cleanly
    const boldRegex = /\*\*(.*?)\*\*/g;
    const bulletRegex = /🔹 (.*?)/g;
    
    let html = text
      .replace(boldRegex, '<strong>$1</strong>')
      .split('\n')
      .map(line => line.trim())
      .join('<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} className="leading-relaxed text-xs break-words" />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Floating Messenger Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="chatbot-trigger"
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer transition-all duration-200 group relative"
          title="Open Assistant Widget"
        >
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-50 animate-pulse"></div>
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
        </button>
      )}

      {/* Floating Chat Container Box */}
      {isOpen && (
        <div className="w-80 sm:w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Header Bar */}
          <div className="h-14 bg-indigo-600 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 font-sans">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <h4 className="font-semibold text-xs leading-none">VitalitySoft Intelligence Agent</h4>
                <p className="text-[9px] text-indigo-150 mt-0.5 font-mono select-none">
                  {isLoggedIn ? "🟢 PEPAKAYALA_ANALYST" : "🔒 SECURE ACCOUNT REQUIRED"}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Message Screen Area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-amber-50 text-amber-800 text-[10px] rounded-lg px-3 py-1.5 border border-amber-200 flex items-center gap-1.5 max-w-[90%]">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span>{msg.text.replace(/\*\*/g, '')}</span>
                    </div>
                  </div>
                );
              }

              // Identify if Apigee status is blocked
              const isApigeeBlocked = msg.apigeeStatus && msg.apigeeStatus.status !== 200;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : isApigeeBlocked
                        ? 'bg-rose-50 text-rose-900 border border-rose-100 rounded-tl-none font-mono text-[11px]'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-sans'
                    }`}
                  >
                    {isApigeeBlocked ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-700 font-bold uppercase text-[9px] tracking-wide">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Apigee Fault Raised</span>
                        </div>
                        <p className="text-xs">{msg.text}</p>
                        <div className="bg-rose-100/50 p-1.5 rounded text-[9px] text-rose-800 mt-1 font-mono uppercase">
                          Code: {msg.apigeeStatus?.errorCode}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {renderMessageContent(msg.text)}
                        {(msg as any).loginRequired && (
                          <div className="mt-2.5 p-2.5 bg-indigo-50 border border-indigo-100/80 rounded-lg flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest font-mono">
                              Portal Authentication Required
                            </span>
                            <p className="text-[10px] text-indigo-900 leading-normal font-sans font-medium">
                              Access standard S-AIS telemetry maps under secure APIGEE proxy.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsLoggedIn(true);
                                setMessages(prev => [
                                  ...prev,
                                  {
                                    id: Date.now().toString() + '-auth-notif',
                                    sender: 'system',
                                    text: "🔑 **Session Established**: Successfully signed in as PEPAKAYALA_ANALYST. Standard vessel telemetry tracks are now unlocked.",
                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  }
                                ]);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition cursor-pointer text-center w-full shadow-2xs"
                            >
                              Sign In Instantly
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <span className={`block text-[8px] mt-1 text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm text-slate-400">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce duration-1000"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[10px] ml-1">AI Middleware processing...</span>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Updates Alert Banner */}
          <div className="px-3 py-2.5 bg-emerald-50 border-t border-b border-emerald-100/80 flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] sm:text-[11px] font-medium leading-tight">Subscribe to vessel alerts via WhatsApp!</p>
            </div>
            <a
              href="https://wa.me/918309616999?text=Get%20Updates"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.03] active:scale-[0.98] text-white font-bold text-[9px] px-2.5 py-1 rounded-full transition whitespace-nowrap block shadow-xs"
            >
              Get Updates
            </a>
          </div>

          {/* Suggestion Pills */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { label: "Track Vitality Sea", q: "Check Vessel 101 position June 10 to June 15" },
              { label: "Ocean Navigator GPS", q: "Where was Ocean Navigator status between June 12 and June 15?" },
              { label: "About VitalitySoft", q: "Tell me about VitalitySoft" },
              { label: "WhatsApp Alerts", q: "How do I subscribe for vessel alerts on WhatsApp?" },
              { label: "Our GIS Services", q: "What active services are available on maps.vitalitysoft.com?" }
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputValue(p.q)}
                className="flex-shrink-0 text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-full px-2.5 py-1 text-slate-500 transition cursor-pointer font-medium whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Footer Entry Box */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 p-3 bg-white flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query vessel, date ranges, or company details..."
              className="flex-1 text-xs bg-slate-50 placeholder-slate-400 focus:bg-white rounded-full px-4 py-2 border border-slate-200 focus:border-indigo-400 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`rounded-full p-2 text-white flex items-center justify-center transition-all ${
                inputValue.trim() && !isTyping
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
