import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Loader2,
  ChevronDown,
  Zap,
  Package,
  Truck,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
}

const QUICK_ACTIONS = [
  { label: 'Critical inventory', icon: Package, prompt: 'Which SKUs are at critical risk right now?' },
  { label: 'Shipment status', icon: Truck, prompt: 'Show me the status of all active shipments' },
  { label: 'Demand forecast', icon: BarChart3, prompt: 'Give me a summary of the demand forecast' },
  { label: 'Active alerts', icon: AlertTriangle, prompt: 'What are the current system alerts?' },
];

// Simple markdown-to-JSX renderer
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const processInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Process bold (**text**) and inline code (`code`)
    const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={match.index} className="text-white font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<code key={match.index} className="px-1.5 py-0.5 bg-neutral-800 rounded text-blue-400 text-[11px] font-mono">{match[3]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return parts.length > 0 ? parts : [line];
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1.5 my-2">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Bullet list items
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, '');
      listItems.push(
        <li key={`li-${i}`} className="flex gap-2 text-[13px] leading-relaxed">
          <span className="text-blue-500 mt-0.5 shrink-0">•</span>
          <span>{processInline(content)}</span>
        </li>
      );
      continue;
    }

    if (inList) flushList();

    // Empty lines
    if (trimmed === '') {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${i}`} className="text-[13px] leading-relaxed">
        {processInline(trimmed)}
      </p>
    );
  }

  flushList();
  return elements;
};

export const AICopilot = ({ csrfToken }: { csrfToken: string | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking('Analyzing your request...');

    try {
      // Build history from previous messages
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${error.message || 'Something went wrong. Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsThinking('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl shadow-blue-600/30 flex items-center justify-center text-white hover:shadow-blue-600/50 hover:scale-105 transition-all duration-200 group"
            id="ai-copilot-toggle"
          >
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] flex flex-col rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl shadow-black/50"
            style={{
              background: 'linear-gradient(180deg, rgba(23,23,23,0.98) 0%, rgba(10,10,10,0.99) 100%)',
              backdropFilter: 'blur(20px)',
            }}
            id="ai-copilot-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">AI Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Gemini 1.5 Flash</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 copilot-scrollbar">
              {/* Welcome message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-6"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-blue-700/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
                    <Sparkles className="w-7 h-7 text-blue-500" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Supply Chain Copilot</h4>
                  <p className="text-xs text-neutral-500 max-w-[280px] leading-relaxed">
                    I can analyze inventory, track shipments, review forecasts, and help you manage your supply chain. Ask me anything!
                  </p>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-5 w-full">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="flex items-center gap-2 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-left hover:bg-neutral-800/80 hover:border-neutral-700 transition-all group"
                      >
                        <action.icon className="w-4 h-4 text-neutral-600 group-hover:text-blue-500 transition-colors shrink-0" />
                        <span className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 transition-colors">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message bubbles */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-blue-600/10">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-bl-md'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-[13px] leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="ai-markdown space-y-1">
                        {renderMarkdown(msg.content)}
                      </div>
                    )}
                    <p className={cn(
                      "text-[9px] mt-2 uppercase tracking-wider font-medium",
                      msg.role === 'user' ? 'text-blue-300/60 text-right' : 'text-neutral-600'
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-blue-600/10">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">{isThinking}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-neutral-700 rounded-full copilot-dot-1" />
                      <div className="w-2 h-2 bg-neutral-700 rounded-full copilot-dot-2" />
                      <div className="w-2 h-2 bg-neutral-700 rounded-full copilot-dot-3" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 pb-4 pt-2 border-t border-neutral-800/50">
              {/* Quick actions below messages */}
              {messages.length > 0 && !isLoading && (
                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 copilot-scrollbar-h">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-lg text-[10px] font-medium text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all whitespace-nowrap shrink-0"
                    >
                      <action.icon className="w-3 h-3" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about inventory, shipments, alerts..."
                  className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                  disabled={isLoading}
                  id="ai-copilot-input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    input.trim() && !isLoading
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                      : "bg-neutral-900 text-neutral-600 border border-neutral-800"
                  )}
                  id="ai-copilot-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
