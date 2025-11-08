import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Loader2, ArrowRight } from 'lucide-react';

// In development, use relative URLs to leverage Vite proxy
// In production, use full API URL
const API_URL = import.meta.env.MODE === 'production' 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  : ''; // Empty string means relative URLs (uses Vite proxy)

interface NavigationAction {
  label: string;
  path: string;
  description?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  isLoading?: boolean; // For optimistic UI
  navigationActions?: NavigationAction[]; // Suggested pages to navigate to
}

interface ChatbotProps {
  // If true, the chat bubble will be hidden (useful for first dashboard page)
  hide?: boolean;
}

export const Chatbot: React.FC<ChatbotProps> = ({ hide = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showRoast, setShowRoast] = useState(false);
  const [currentRoast, setCurrentRoast] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initialize with sessionStorage on mount
    const playerData = (location.state as any)?.playerData;
    const puuid = playerData?.puuid || 'guest';
    const storageKey = `rift_chat_${puuid}`;
    
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to restore chat history:', err);
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const assistantIndexRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const roastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roastIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get player data directly from location
  const playerData = (location.state as any)?.playerData;
  const puuid = playerData?.puuid || 'guest';

  // Roast messages based on player data
  const roasts = playerData ? [
    `${playerData.winRate}% WR? You sure you're not inting? 💀`,
    `Avoiding me? Your gameplay won't improve itself...`,
    `Click me. I dare you. Let's talk about that KDA. 🔥`,
    `${playerData.avgKDA?.toFixed(1)} KDA... we need to talk.`,
    `Your ${playerData.topChampions?.[0]?.championName} needs serious help 😬`,
  ] : [
    `Afraid to face the truth? I don't bite... much. 🔥`,
    `Click me if you're brave enough 💀`,
    `Still here? Let's roast your gameplay.`,
    `I'm watching your every move... or lack thereof 😈`,
  ];

  // Handle chat open/close with roast management
  const handleOpenChat = () => {
    setOpen(true);
    setShowRoast(false);
    // Clear roast timers when opening chat
    if (roastTimerRef.current) {
      clearTimeout(roastTimerRef.current);
      roastTimerRef.current = null;
    }
    if (roastIntervalRef.current) {
      clearInterval(roastIntervalRef.current);
      roastIntervalRef.current = null;
    }
  };

  const handleCloseChat = () => {
    setOpen(false);
    // Start roast timers when closing chat
    startRoastTimers();
  };

  // Start roast animation timers
  const startRoastTimers = () => {
    if (hide || open) return;

    // Clear existing timers
    if (roastTimerRef.current) clearTimeout(roastTimerRef.current);
    if (roastIntervalRef.current) clearInterval(roastIntervalRef.current);

    // Show first roast after 8 seconds (less intrusive)
    roastTimerRef.current = setTimeout(() => {
      const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
      setCurrentRoast(randomRoast);
      setShowRoast(true);

      // Hide roast after 6 seconds (longer display)
      setTimeout(() => setShowRoast(false), 6000);
    }, 8000);

    // Show subsequent roasts every 25 seconds (less frequent)
    roastIntervalRef.current = setInterval(() => {
      const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
      setCurrentRoast(randomRoast);
      setShowRoast(true);

      // Hide roast after 6 seconds
      setTimeout(() => setShowRoast(false), 6000);
    }, 25000);
  };

  // Handle location changes
  if ((location.state as any)?.hideChat && open) {
    setOpen(false);
  }

  // Auto-scroll when messages change
  if (listRef.current && messages.length > 0) {
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  // Save to sessionStorage when messages change
  if (messages.length > 0) {
    const storageKey = `rift_chat_${puuid}`;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (err) {
      console.warn('Failed to save chat history:', err);
    }
  }

  // Initialize roast timers when component mounts or chat closes
  if (!open && !hide && !roastTimerRef.current && !roastIntervalRef.current) {
    startRoastTimers();
  }

  // Minimal cleanup effect only (unavoidable for proper cleanup)
  React.useEffect(() => {
    return () => {
      // Cleanup timers on unmount
      if (roastTimerRef.current) clearTimeout(roastTimerRef.current);
      if (roastIntervalRef.current) clearInterval(roastIntervalRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const sendMessage = async (messageText?: string) => {
    const userText = messageText || input.trim();
    if (!userText || isStreaming) return;
    
    setInput(''); // Clear input immediately for better UX

    // OPTIMISTIC UI: Add user message instantly
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text: userText };
    setMessages((m) => [...m, userMsg]);

    // OPTIMISTIC UI: Create assistant placeholder with loading state
    const assistantMsgId = `a_${Date.now()}`;
    const assistantMsg: ChatMessage = { 
      id: assistantMsgId, 
      role: 'assistant', 
      text: '', 
      isLoading: true 
    };
    setMessages((m) => {
      assistantIndexRef.current = m.length; // index where assistant will be
      return [...m, assistantMsg];
    });

    setIsStreaming(true);

    try {
      // Build conversation history (exclude empty messages and system messages)
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system' && msg.text && msg.text.trim().length > 0)
        .map(msg => ({ role: msg.role, content: msg.text }));

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // POST to /api/chat with NDJSON streaming (include player context)
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText, 
          history: conversationHistory,
          playerContext: playerData // Send full player data including insights
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read NDJSON stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.delta) {
              // Append token to assistant message
              setMessages((m) => 
                m.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, text: (msg.text || '') + data.delta, isLoading: false }
                    : msg
                )
              );
            } else if (data.replaceText !== undefined) {
              // Replace full text (used to remove NAVIGATE lines)
              setMessages((m) => 
                m.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, text: data.replaceText }
                    : msg
                )
              );
            } else if (data.navigationActions) {
              // Add navigation actions to the assistant message
              setMessages((m) => {
                const updated = m.map(msg => {
                  if (msg.id === assistantMsgId) {
                    return { ...msg, navigationActions: data.navigationActions };
                  }
                  return msg;
                });
                return updated;
              });
            } else if (data.done) {
              // Stream complete
              setMessages((m) => 
                m.map(msg => 
                  msg.id === assistantMsgId 
                    ? { ...msg, isLoading: false }
                    : msg
                )
              );
              assistantIndexRef.current = null;
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            console.warn('Failed to parse NDJSON line:', line, parseErr);
          }
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
        return;
      }

      console.error('Failed to send message:', err);
      
      // Update placeholder with error
      setMessages((m) => {
        const copy = [...m];
        const aiIndex = assistantIndexRef.current ?? (copy.length - 1);
        if (copy[aiIndex]) {
          copy[aiIndex] = { 
            ...copy[aiIndex], 
            text: err.message || "Sorry, I couldn't reach the server. Please try again.",
            isLoading: false 
          };
        }
        assistantIndexRef.current = null;
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Roasting welcome message with prompt suggestions
  const isFirstTime = messages.length === 0;
  const roastingWelcome = playerData ? 
    `Alright ${playerData.riotId}, let's see what we're working with... ${playerData.winRate}% win rate? *Chef's kiss* 💀 I've seen Bronze players with better stats. But hey, at least you showed up. What do you want to know about your "gameplay"?` :
    `Well, well, well... looks like someone finally decided to face reality. Ready to hear the truth about your gameplay? I promise I'll go easy on you... just kidding, I won't. 😈`;

  const promptSuggestions = playerData ? [
    "Roast my gameplay 🔥",
    `Why is my ${playerData.topChampions?.[0]?.championName || 'main'} trash?`,
    "What am I doing wrong?",
    "Help me git gud"
  ] : [
    "Roast my gameplay 🔥",
    "What are my biggest mistakes?",
    "How bad am I really?",
    "Give me actually useful tips"
  ];

  if (hide) return null;

  return (
    <div>
      {/* Tab-style button for mobile, floating button for desktop */}
      <div className="fixed right-0 top-1/3 md:bottom-8 md:right-8 md:top-auto z-40">
        {!open && (
          <div className="relative">
            {/* Roasting speech bubble - positioned differently for mobile vs desktop */}
            {showRoast && (
              <>
                {/* Mobile: Left-pointing speech bubble */}
                <div className="md:hidden absolute right-16 top-1/2 -translate-y-1/2 w-52 animate-in slide-in-from-right-5 fade-in duration-300">
                  <div className="relative bg-[rgba(10,20,40,0.95)] backdrop-blur-sm border-2 border-gold/40 p-3 shadow-xl"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)'
                    }}
                  >
                    <div className="text-sm text-gold/90 lol-body">{currentRoast}</div>
                    {/* Arrow pointing to tab */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 bg-[rgba(10,20,40,0.95)] border-t-2 border-r-2 border-gold/40 transform rotate-45"></div>
                  </div>
                </div>

                {/* Desktop: Bottom-pointing speech bubble */}
                <div className="hidden md:block absolute bottom-24 right-0 mb-2 w-64 animate-in slide-in-from-bottom-5 fade-in duration-300">
                  <div className="relative bg-[rgba(10,20,40,0.95)] backdrop-blur-sm border-2 border-gold/40 p-3 shadow-xl"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                    }}
                  >
                    <div className="text-sm text-gold/90 lol-body">{currentRoast}</div>
                    {/* Arrow pointing to bubble */}
                    <div className="absolute -bottom-3 right-8 w-6 h-6 bg-[rgba(10,20,40,0.95)] border-r-2 border-b-2 border-gold/40 transform rotate-45"></div>
                  </div>
                </div>
              </>
            )}

            {/* Mobile: Vertical tab on right edge */}
            <button
              aria-label="Open chat"
              onClick={handleOpenChat}
              className="md:hidden group relative h-32 w-12 bg-[rgba(10,20,40,0.9)] border-2 border-r-0 border-gold hover:border-gold-emphasis transition-all duration-300 flex items-center justify-center overflow-hidden"
              style={{
                clipPath: 'polygon(0 8%, 15% 0, 100% 0, 100% 100%, 15% 100%, 0 92%)',
                animation: showRoast
                  ? 'wiggle 0.5s ease-in-out'
                  : 'wiggle 3s ease-in-out infinite'
              }}
            >
              {/* Gold glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8AA6E]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 30px rgba(200, 170, 110, 0.5), inset 0 0 20px rgba(200, 170, 110, 0.1)'
                }}
              />

              {/* Pulsing glow ring */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  boxShadow: '0 0 20px rgba(200, 170, 110, 0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />

              <span className="relative text-3xl transform -rotate-90 group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(200,170,110,0.6)]">🔥</span>
            </button>

            {/* Desktop: Octagonal floating button */}
            <button
              aria-label="Open chat"
              onClick={handleOpenChat}
              className="hidden md:flex group relative w-[4.5rem] h-[4.5rem] bg-[rgba(10,20,40,0.9)] border-2 border-gold hover:border-gold-emphasis transition-all duration-300 items-center justify-center overflow-hidden"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                animation: showRoast
                  ? 'wiggle 0.5s ease-in-out'
                  : 'wiggle 3s ease-in-out infinite'
              }}
            >
              {/* Gold glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8AA6E]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: '0 0 30px rgba(200, 170, 110, 0.5), inset 0 0 20px rgba(200, 170, 110, 0.1)'
                }}
              />

              {/* Pulsing glow ring */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  boxShadow: '0 0 20px rgba(200, 170, 110, 0.4)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />

              <span className="relative text-4xl group-hover:scale-110 transition-transform filter drop-shadow-[0_0_8px_rgba(200,170,110,0.6)]">🔥</span>
            </button>
          </div>
        )}

        {open && (
          <div className="w-96 max-w-[90vw] h-[520px] bg-card/90 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-b from-background/70 to-background/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">🔥</div>
                <div>
                  <div className="font-semibold">RiftRewind Coach</div>
                  <div className="text-xs text-muted-foreground">Brutally honest. Occasionally helpful.</div>
                </div>
              </div>
              <button onClick={handleCloseChat} className="p-1 rounded hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 p-3 overflow-auto space-y-3">
              {/* First-time welcome message with roasting personality */}
              {isFirstTime && (
                <div className="space-y-3">
                  {/* Welcome roast with avatar */}
                  <div className="flex gap-2 justify-start">
                    {/* Coach avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <span className="text-lg">🔥</span>
                    </div>
                    
                    {/* Welcome message */}
                    <div className="max-w-[80%] p-3 rounded-lg bg-card/50 text-foreground border border-primary/20">
                      <div className="font-semibold text-primary mb-1">Coach</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{roastingWelcome}</div>
                    </div>
                  </div>

                  {/* Suggestion buttons */}
                  <div className="flex flex-wrap gap-2 px-2">
                    {promptSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        disabled={isStreaming}
                        className="text-xs px-3 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                return (
                <React.Fragment key={m.id}>
                  {/* Message row */}
                  <div className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar for assistant */}
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <span className="text-lg">🔥</span>
                      </div>
                    )}
                    
                    {/* Message bubble */}
                    <div className={`p-3 rounded-lg max-w-[75%] ${
                      m.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-card/50 text-foreground border border-border'
                    }`}>
                      {m.isLoading && m.text === '' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.text || '...'}</div>
                      )}
                    </div>

                    {/* Avatar for user */}
                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm border-2 border-primary/30">
                        {playerData?.riotId?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Navigation buttons (rendered separately below message) */}
                  {m.role === 'assistant' && m.navigationActions && m.navigationActions.length > 0 && (
                    <div className="flex gap-2 pl-10">
                      <div className="flex flex-col gap-1.5 max-w-[75%]">
                        {m.navigationActions.map((action, idx) => {
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                navigate(action.path, { state: { playerData } });
                                setOpen(false);
                              }}
                              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-sm transition-colors group"
                            >
                              <span className="font-medium">{action.label}</span>
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
                );
              })}
            </div>

            <div className="p-3 border-t border-border bg-background/60">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
                  className="flex-1 rounded-md border border-border px-3 py-2 bg-transparent text-sm focus:outline-none"
                  placeholder="Ask about your season, tips, or playstyle..."
                  disabled={isStreaming}
                />
                <Button 
                  onClick={() => sendMessage()} 
                  disabled={!input.trim() || isStreaming}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
