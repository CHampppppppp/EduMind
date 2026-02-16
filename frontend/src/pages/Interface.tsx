import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Bot, User, Cpu, Sparkles, BrainCircuit, Plus, History } from 'lucide-react';
import type { Message, ChatSession } from '@/types';
import { VoiceInput } from '@/components/VoiceInput';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { StreamMarkdown } from '@/components/StreamMarkdown';
import { authFetch, getStoredUser } from '@/lib/auth';

export function Interface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing_intent' | 'reasoning' | 'summarizing'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [searchParams] = useSearchParams();
  const initialChatId = searchParams.get('id');

  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [history, setHistory] = useState<ChatSession[]>([]);

  // 清理 WebSocket 连接
  const cleanupWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // 重置所有状态
  const resetState = () => {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setProcessingState('idle');
    cleanupWebSocket();
  };

  useEffect(() => {
    fetchHistory();
    if (initialChatId) {
      loadChat(initialChatId);
    }
  }, [initialChatId]);

  // 监听 chatId 变化，切换对话时重新加载
  useEffect(() => {
    if (chatId && chatId !== initialChatId) {
      resetState();
      loadChat(chatId);
    }
  }, [chatId]);

  // 组件卸载时清理 WebSocket
  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await authFetch('/api/v1/chat/history?days=3');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChat = async (id: string) => {
    try {
      setChatId(id);
      const res = await authFetch(`/api/v1/chat/${id}/messages`);
      const data = await res.json();
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id || Date.now().toString(),
        role: msg.role,
        content: msg.content,
        type: 'text',
        timestamp: msg.created_at || new Date().toISOString(),
        model: msg.model,
        thinking: msg.thinking
      }));
      setMessages(formattedMessages);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    window.location.href = '/chat';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, processingState]);

  const handleSend = () => {
    if (!input.trim()) return;

    // 如果已有连接，先关闭
    cleanupWebSocket();

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, newMessage]);
    setInput('');
    setIsTyping(true);
    setProcessingState('analyzing_intent');

    const ws = new WebSocket('ws://localhost:8000/api/v1/chat/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      const user = getStoredUser();
      ws.send(JSON.stringify({
        type: "text_message",
        content: newMessage.content,
        chat_id: chatId,
        user_id: user?.id || null
      }));
    };

    let currentThinking = "";
    let currentContent = "";
    let isFirstChunk = true;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat_info') {
        setChatId(data.chat_id);
        fetchHistory();
      } else if (data.type === 'status') {
        if (data.content === 'analyzing_intent') setProcessingState('analyzing_intent');
        else if (data.content === 'reasoning') setProcessingState('reasoning');
        else if (data.content === 'summarizing' || data.content === 'generating') setProcessingState('summarizing');
      } else if (data.type === 'thinking_chunk') {
        currentThinking += data.content;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'temp-ai') {
            return prev.map(m => m.id === 'temp-ai' ? { ...m, thinking: currentThinking } : m);
          } else {
            return [...prev, {
              id: 'temp-ai',
              role: 'assistant',
              content: '',
              thinking: currentThinking,
              type: 'text',
              timestamp: new Date().toISOString(),
              model: 'deepseek-v3-reasoner'
            }];
          }
        });
      } else if (data.type === 'llm_chunk') {
        if (isFirstChunk) {
          setIsTyping(false);
          isFirstChunk = false;
        }
        currentContent += data.content;
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'temp-ai') {
            return prev.map(m => m.id === 'temp-ai' ? { ...m, content: currentContent, model: data.model || m.model } : m);
          } else {
            return [...prev, {
              id: 'temp-ai',
              role: 'assistant',
              content: currentContent,
              type: 'text',
              timestamp: new Date().toISOString(),
              model: data.model || 'kimi-k2.5'
            }];
          }
        });
      } else if (data.type === 'llm_end') {
        setProcessingState('idle');
        ws.close();
        wsRef.current = null;
      } else if (data.type === 'error') {
        console.error("WS Error:", data.content);
        setProcessingState('idle');
        ws.close();
        wsRef.current = null;
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      setProcessingState('idle');
    };
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col p-4">
        <button
          onClick={startNewChat}
          className="flex items-center justify-center w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors mb-6 shadow-sm"
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
            <button
              key={chat.id}
              onClick={() => window.location.href = `/chat?id=${chat.id}`}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${chatId === chat.id
                ? 'bg-white text-black shadow-sm font-medium'
                : 'text-gray-600 hover:bg-gray-200/50'
                }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
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
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className="flex flex-col items-start w-full min-w-0">
                    <div
                      className={`p-4 rounded-2xl shadow-sm w-full overflow-hidden ${msg.role === 'user'
                        ? 'bg-black text-white rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                    >
                      <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                        {msg.role === 'assistant' && index === messages.length - 1 ? (
                          <StreamMarkdown content={msg.content} />
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}
                      </div>
                      <div className={`text-[10px] mt-2 opacity-70 uppercase tracking-wider font-medium ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-end space-x-3"
            >
              <div className="h-8 w-8 rounded-full bg-gray-100 text-black flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none flex items-center space-x-3 shadow-sm">
                {processingState === 'analyzing_intent' && (
                  <span className="text-xs text-blue-500 font-medium flex items-center animate-pulse">
                    <BrainCircuit className="h-3 w-3 mr-2" />
                    正在识别意图...
                  </span>
                )}
                {processingState === 'reasoning' && (
                  <span className="text-xs text-purple-500 font-medium flex items-center animate-pulse">
                    <Cpu className="h-3 w-3 mr-2 animate-spin" />
                    正在进行深度推理...
                  </span>
                )}
                {processingState === 'summarizing' && (
                  <span className="text-xs text-green-600 font-medium flex items-center animate-pulse">
                    <Sparkles className="h-3 w-3 mr-2 animate-pulse" />
                    Kimi 正在生成回答...
                  </span>
                )}
              </div>
            </motion.div>
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
                    id: Date.now().toString(),
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
                  const isLastAssistant = lastMsg && lastMsg.role === 'assistant';

                  if (isFinal) {
                    setIsTyping(false);
                    setProcessingState('idle');
                    if (isLastAssistant) {
                      return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, content: text } : msg);
                    } else {
                      return [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: text,
                        type: 'text',
                        timestamp: new Date().toISOString(),
                        model: 'kimi-k2.5'
                      }];
                    }
                  } else {
                    if (isLastAssistant) {
                      return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, content: msg.content + text } : msg);
                    } else {
                      return [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: text,
                        type: 'text',
                        timestamp: new Date().toISOString(),
                        model: 'kimi-k2.5'
                      }];
                    }
                  }
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