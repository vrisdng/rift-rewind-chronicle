import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Loader2 } from 'lucide-react';

// In development, use relative URLs to leverage Vite proxy
// In production, use full API URL
const API_URL = import.meta.env.MODE === 'production' 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
  : ''; // Empty string means relative URLs (uses Vite proxy)

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  isLoading?: boolean; // For optimistic UI
}

interface ChatbotProps {
  // If true, the chat bubble will be hidden (useful for first dashboard page)
  hide?: boolean;
}

export const Chatbot: React.FC<ChatbotProps> = ({ hide = false }) => {
  const location = useLocation();
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
        console.log('✅ Restored chat history from sessionStorage');
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
    const assistantMsg: ChatMessage = { 
      id: `a_${Date.now()}`, 
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

      console.log('💬 Sending chat message...');

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
          console.log('✅ Stream complete');
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
              setMessages((m) => {
                const copy = [...m];
                const aiIndex = assistantIndexRef.current;
                if (aiIndex != null && copy[aiIndex]?.role === 'assistant') {
                  copy[aiIndex] = {
                    ...copy[aiIndex],
                    text: (copy[aiIndex].text || '') + data.delta,
                    isLoading: false,
                  };
                }
                return copy;
              });
            } else if (data.done) {
              // Stream complete
              setMessages((m) => {
                const copy = [...m];
                const aiIndex = assistantIndexRef.current;
                if (aiIndex != null && copy[aiIndex]) {
                  copy[aiIndex] = { ...copy[aiIndex], isLoading: false };
                }
                return copy;
              });
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
      {/* Bubble button with animation and roasting speech bubbles */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <div className="relative">
            {/* Roasting speech bubble */}
            {showRoast && (
              <div className="absolute bottom-16 right-0 mb-2 w-64 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="relative bg-card/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-xl">
                  <div className="text-sm text-foreground">{currentRoast}</div>
                  {/* Arrow pointing to bubble */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card/95 border-r border-b border-primary/30 transform rotate-45"></div>
                </div>
              </div>
            )}
            
            {/* Animated bubble button with wiggle */}
            <button
              aria-label="Open chat"
              onClick={handleOpenChat}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/90 to-primary hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/50 flex items-center justify-center text-white group"
              style={{
                animation: showRoast 
                  ? 'wiggle 0.5s ease-in-out' 
                  : 'wiggle 3s ease-in-out infinite'
              }}
            >
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse opacity-50"></div>
              <span className="relative text-2xl group-hover:scale-110 transition-transform">🔥</span>
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

              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar for assistant */}
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <span className="text-lg">🔥</span>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div className={`max-w-[75%] p-3 rounded-lg ${
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
              ))}
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
