import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Bot, Sparkles, BrainCircuit, Plus, History, Trash2, User, Cpu } from 'lucide-react';
import type { Message, ChatSession } from '@/types';
import { VoiceInput } from '@/components/VoiceInput';
import { StreamMarkdown } from '@/components/StreamMarkdown';
import { authFetch } from '@/lib/auth';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function Interface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing_intent' | 'reasoning' | 'summarizing'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChatId = searchParams.get('id');
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [history, setHistory] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (searchParams.get('id') !== chatId) {
      setChatId(searchParams.get('id'));
    }
  }, [searchParams, chatId]);

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
          setChatId(data.chat_id);
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
          navigate('/chat');
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
    navigate('/chat');
    resetState();
    setChatId(null);
  };

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else {
      resetState();
    }
  }, [chatId]);

  useEffect(() => {
    fetchHistory();
    if (!initialChatId) {
      initChatSession();
    }
  }, [initialChatId]);

  useEffect(() => {
    return () => cleanupWebSocket();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, processingState]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!chatId) {
      const newChatId = await initChatSession();
      if (!newChatId) return;
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
          chat_id: chatId,
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

  return (
    <div className="flex h-full w-full">
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col p-4">
        <button
          onClick={startNewChat}
          disabled={isTyping}
          className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors mb-6 shadow-sm ${isTyping ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          发起新对话
        </button>

        <div className="flex items-center text-sm font-medium text-gray-500 mb-2 px-2">
          <History className="h-4 w-4 mr-2" />
          最近3天
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          {history.length === 0 && (
            <div className="text-xs text-gray-400 px-2 py-4 text-center">暂无历史记录</div>
          )}
          {history.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm truncate transition-colors ${isTyping ? 'opacity-50 cursor-not-allowed' : chatId === chat.id ? 'bg-white text-black shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-200/50'}`}
            >
              <button
                onClick={() => !isTyping && navigate(`/chat?id=${chat.id}`)}
                disabled={isTyping}
                className="flex-1 text-left truncate"
              >
                {chat.title}
              </button>
              <button
                onClick={(e) => deleteChat(chat.id, e)}
                disabled={isTyping}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all ${isTyping ? 'cursor-not-allowed' : ''}`}
                title="删除对话"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h1 className="text-3xl font-light tracking-tight">对话交互</h1>
            <p className="text-sm text-muted-foreground">与 EduMind 对话，创建您的教学计划。</p>
          </div>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              在线
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto space-y-8 p-8 custom-scrollbar overscroll-none scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className="flex flex-col items-start w-full min-w-0">
                  <div className={`p-4 rounded-2xl shadow-sm w-full overflow-hidden ${msg.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
                    <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                      <StreamMarkdown content={msg.content} />
                    </div>
                    <div className="text-[10px] mt-2 opacity-70 uppercase tracking-wider font-medium text-gray-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start items-end space-x-3">
              <div className="h-8 w-8 rounded-full bg-gray-100 text-black flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none flex flex-col space-y-1 shadow-sm min-w-[150px]">
                {processingState === 'analyzing_intent' && (
                  <span className="text-xs text-blue-500 font-medium flex items-center animate-pulse">
                    <BrainCircuit className="h-3 w-3 mr-2" />
                    正在识别意图...
                  </span>
                )}
                {processingState === 'reasoning' && (
                  <span className="text-xs text-purple-600 font-medium flex items-center">
                    <Cpu className="h-3 w-3 mr-2 animate-spin" />
                    正在进行深度推理...
                  </span>
                )}
                {processingState === 'summarizing' && (
                  <span className="text-xs text-green-600 font-medium flex items-center animate-pulse">
                    <Sparkles className="h-3 w-3 mr-2 animate-pulse" />
                    正在生成精确总结...
                  </span>
                )}
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-8 pt-0">
          <div className="glass p-2 rounded-2xl border border-gray-200 flex items-center space-x-2 shadow-lg bg-white/80 backdrop-blur-md">
            <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="描述您的课程需求..."
              className="flex-1 bg-transparent border-none outline-none text-lg px-2 placeholder:text-gray-300"
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
              className="p-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
