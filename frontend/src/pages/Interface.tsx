import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Bot, Sparkles, BrainCircuit, Plus, History, Trash2, User, Cpu, Database } from 'lucide-react';
import type { Message, ChatSession } from '@/types';
import { VoiceInput } from '@/components/VoiceInput';
import { StreamMarkdown } from '@/components/StreamMarkdown';
import { authFetch } from '@/lib/auth';
import { FadeIn, SlideUp, ScaleIn } from '@/components/ui/motion';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function Interface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing_intent' | 'reasoning' | 'summarizing' | 'retrieving_knowledge'>('idle');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialChatId = searchParams.get('id');
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const isInitialized = useRef(false);
  const skipNextLoadChat = useRef(false);

  const cleanupWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const resetState = () => {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setProcessingState('idle');
    cleanupWebSocket();
  };

  const fetchHistory = async () => {
    try {
      const res = await authFetch('/api/v1/chat/history?days=3');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const initChatSession = async () => {
    if (chatId) return chatId;
    try {
      const res = await authFetch('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({ content: '' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.chat_id) {
          return data.chat_id;
        }
      }
    } catch (e) {
      console.error("Failed to init chat session:", e);
    }
    return null;
  };

  const deleteChat = async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/v1/chat/${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(chat => chat.id !== idToDelete));
        if (chatId === idToDelete) {
          localStorage.removeItem('lastChatId');
          navigate('/interface');
          resetState();
          setChatId(null);
        }
      }
    } catch (e) {
      console.error('删除对话失败:', e);
    }
  };

  const loadChat = async (id: string) => {
    cleanupWebSocket();
    setIsTyping(false);
    setProcessingState('idle');
    setMessages([]);
    try {
      setChatId(id);
      const res = await authFetch(`/api/v1/chat/${id}/messages`);
      const data = await res.json();
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id || generateId(),
        role: msg.role,
        content: msg.content,
        type: 'text',
        timestamp: msg.created_at || new Date().toISOString(),
        model: msg.model,
      }));
      setMessages(formattedMessages);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    localStorage.removeItem('lastChatId');
    navigate('/interface');
    resetState();
    setChatId(null);
  };

  useEffect(() => {
    const urlId = searchParams.get('id');

    if (!urlId) {
      const lastId = localStorage.getItem('lastChatId');
      if (lastId) {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.set('id', lastId);
          return newParams;
        }, { replace: true });
      } else {
        if (chatId !== null) {
          setChatId(null);
          resetState();
        }
      }
    } else {
      if (urlId !== chatId) {
        setChatId(urlId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (chatId) {
      if (skipNextLoadChat.current) {
        skipNextLoadChat.current = false;
        return;
      }
      localStorage.setItem('lastChatId', chatId);
      loadChat(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    return () => cleanupWebSocket();
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping, processingState]);

  const handleSend = async () => {
    if (!input.trim()) return;

    let currentChatId = chatId;

    if (!chatId) {
      const newChatId = await initChatSession();
      if (!newChatId) return;
      skipNextLoadChat.current = true;
      setChatId(newChatId);
      setSearchParams({ id: newChatId }, { replace: true });
      currentChatId = newChatId;
    }

    cleanupWebSocket();

    const newMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const sanitized = prev.map(m => m.id === 'temp-ai' ? { ...m, id: generateId() } : m);
      return [...sanitized, newMessage];
    });
    setInput('');
    setIsTyping(true);
    setProcessingState('analyzing_intent');

    const ws = new WebSocket('ws://localhost:8000/api/v1/chat/ws');
    wsRef.current = ws;

    let currentContent = "";
    let isFirstChunk = true;

    ws.onopen = () => {
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        ws.send(JSON.stringify({
          type: "text_message",
          content: newMessage.content,
          chat_id: currentChatId,
          user_id: user?.id || null
        }));
      }, 300);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_info') {
          setChatId(data.chat_id);
          fetchHistory();
        } else if (data.type === 'status') {
          if (data.content === 'analyzing_intent') setProcessingState('analyzing_intent');
          else if (data.content === 'reasoning') setProcessingState('reasoning');
          else if (data.content === 'summarizing' || data.content === 'generating') setProcessingState('summarizing');
          else if (data.content === 'retrieving_knowledge') setProcessingState('retrieving_knowledge');
        } else if (data.type === 'llm_chunk') {
          if (isFirstChunk) {
            setIsTyping(false);
            isFirstChunk = false;
          }
          currentContent += data.content;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === 'assistant' && lastMsg.id === 'temp-ai') {
              return prev.map(m => m.id === 'temp-ai' ? { ...m, content: currentContent, model: data.model || m.model } : m);
            }
            return [...prev, {
              id: 'temp-ai',
              role: 'assistant',
              content: currentContent,
              type: 'text',
              timestamp: new Date().toISOString(),
              model: data.model || 'deepseek-v3-reasoner'
            }];
          });
        } else if (data.type === 'llm_end') {
          setMessages(prev => prev.map(m => m.id === 'temp-ai' ? { ...m, id: generateId() } : m));
          setProcessingState('idle');
          ws.close();
          wsRef.current = null;
        } else if (data.type === 'error') {
          console.error("WS Error:", data.content);
          setMessages(prev => prev.map(m => m.id === 'temp-ai' ? { ...m, id: generateId() } : m));
          setProcessingState('idle');
          ws.close();
          wsRef.current = null;
        }
      } catch (err) {
        console.error("Error processing message:", err);
      }
    };

    ws.onerror = () => {
      setProcessingState('idle');
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.id === 'temp-ai') {
          return prev.map(m => m.id === 'temp-ai' ? { ...m, id: generateId(), content: m.content + '\n\n⚠️ 连接出现问题，请重试。' } : m);
        }
        return [...prev, {
          id: generateId(),
          role: 'assistant',
          content: '⚠️ 连接出现问题，请重试。',
          type: 'text',
          timestamp: new Date().toISOString()
        }];
      });
    };

    ws.onclose = () => { };
  };

  const isNewChat = messages.length === 0;

  return (
    <div className="flex h-full w-full">
      <div className="w-48 border-r border-border bg-sidebar flex flex-col p-4">
        <FadeIn delay={0.1} className="flex flex-col h-full">
          <button
            onClick={startNewChat}
            disabled={isTyping}
            className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors mb-6 shadow-sm ${isTyping ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            <Plus className="h-4 w-4 mr-2" />
            发起新对话
          </button>

          <div className="flex items-center text-sm font-medium text-muted-foreground mb-2 px-2">
            <History className="h-4 w-4 mr-2" />
            最近3天
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {history.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-4 text-center">暂无历史记录</div>
            )}
            {history.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm truncate transition-colors ${isTyping ? 'opacity-50 cursor-not-allowed' : chatId === chat.id ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm font-medium' : 'text-muted-foreground hover:bg-sidebar-accent/50'}`}
              >
                <button
                  onClick={() => !isTyping && navigate(`/interface?id=${chat.id}`)}
                  disabled={isTyping}
                  className="flex-1 text-left truncate"
                >
                  {chat.title}
                </button>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  disabled={isTyping}
                  className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-accent rounded transition-all ${isTyping ? 'cursor-not-allowed' : ''}`}
                  title="删除对话"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-background">
        <header className="px-8 py-6 flex justify-between items-center border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">对话交互</h1>
            <p className="text-sm text-muted-foreground">与 EduMind 对话，创建您的教学计划。</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center dark:bg-green-900/30 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              在线
            </span>
          </div>
        </header>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Greeting - Only visible in new chat */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center pb-40 transition-opacity duration-300 ${isNewChat ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-transparent p-4 rounded-3xl mb-8 flex items-center justify-center">
              <Bot className="h-5 w-5 text-foreground mr-4" />
              <h2 className="text-2xl font-medium text-foreground">今天有什么可以帮到你？</h2>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto space-y-8 p-8 custom-scrollbar overscroll-none scroll-smooth ${isNewChat ? 'invisible' : 'visible'}`}
          >
            {messages.map((msg) => (
              <SlideUp key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col items-start w-full min-w-0">
                    <div className={`p-4 rounded-2xl shadow-sm w-full overflow-hidden ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border border-border text-card-foreground rounded-bl-none'}`}>
                      <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-primary-foreground' : 'text-card-foreground'}`}>
                        <StreamMarkdown content={msg.content} />
                      </div>
                      <div className="text-[10px] mt-2 opacity-70 uppercase tracking-wider font-medium text-current">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </SlideUp>
            ))}

            {isTyping && (
              <div className="flex justify-start items-end space-x-3">
                <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-none flex flex-col space-y-1 shadow-sm min-w-[150px]">
                  {processingState === 'analyzing_intent' && (
                    <span className="text-xs text-blue-500 font-medium flex items-center animate-pulse dark:text-blue-400">
                      <BrainCircuit className="h-3 w-3 mr-2" />
                      正在识别意图...
                    </span>
                  )}
                  {processingState === 'retrieving_knowledge' && (
                    <span className="text-xs text-orange-500 font-medium flex items-center animate-pulse dark:text-orange-400">
                      <Database className="h-3 w-3 mr-2" />
                      正在查询知识库...
                    </span>
                  )}
                  {processingState === 'reasoning' && (
                    <span className="text-xs text-purple-600 font-medium flex items-center dark:text-purple-400">
                      <Cpu className="h-3 w-3 mr-2 animate-spin" />
                      正在进行深度推理...
                    </span>
                  )}
                  {processingState === 'summarizing' && (
                    <span className="text-xs text-green-600 font-medium flex items-center animate-pulse dark:text-green-400">
                      <Sparkles className="h-3 w-3 mr-2 animate-pulse" />
                      正在生成精确总结...
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className={`transition-all duration-500 ease-in-out ${isNewChat
            ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4'
            : 'relative p-8 pt-0 w-full'
            }`}>
            <div className={`glass p-2 rounded-2xl border border-border flex items-center space-x-2 shadow-lg bg-background/80 backdrop-blur-md ${isNewChat ? 'shadow-xl' : ''}`}>
              <button className="p-3 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSend();
                  }
                }}
                placeholder="描述您的课程需求..."
                className="flex-1 bg-transparent border-none outline-none text-lg px-2 placeholder:text-muted-foreground/50 text-foreground"
              />

              <VoiceInput
                onTranscriptUpdate={(text, isFinal) => {
                  if (isFinal) {
                    const newMessage: Message = {
                      id: generateId(),
                      role: 'user',
                      content: text,
                      type: 'text',
                      timestamp: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, newMessage]);
                    setIsTyping(true);
                    setProcessingState('summarizing');
                  } else {
                    setInput(text);
                  }
                }}
                onLLMMessage={(text, isFinal) => {
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    const isLastAssistant = lastMsg?.role === 'assistant';

                    if (isFinal) {
                      setIsTyping(false);
                      setProcessingState('idle');
                      if (isLastAssistant) {
                        return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, content: text } : msg);
                      }
                      return [...prev, { id: generateId(), role: 'assistant', content: text, type: 'text', timestamp: new Date().toISOString(), model: 'kimi-k2.5' }];
                    }
                    if (isLastAssistant) {
                      return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, content: msg.content + text } : msg);
                    }
                    return [...prev, { id: generateId(), role: 'assistant', content: text, type: 'text', timestamp: new Date().toISOString(), model: 'kimi-k2.5' }];
                  });
                }}
              />

              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
