import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Paperclip, Bot, Sparkles, BrainCircuit, Plus, History, Trash2, User, Cpu } from 'lucide-react';
import type { Message, ChatSession } from '@/types';
import { VoiceInput } from '@/components/VoiceInput';
import { StreamMarkdown } from '@/components/StreamMarkdown';
import { authFetch, getStoredUser } from '@/lib/auth';

// 生成唯一ID
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
  const isMounted = useRef(false);

  // 监听 URL 参数变化，更新 chatId
  useEffect(() => {
    const newChatId = searchParams.get('id');
    if (newChatId !== chatId) {
      setChatId(newChatId);
    }
    isMounted.current = true;
  }, [searchParams, chatId]);

  // 清理 WebSocket 连接
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 重置所有状态
  const resetState = useCallback(() => {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setProcessingState('idle');
    cleanupWebSocket();
  }, [cleanupWebSocket]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/chat/history?days=3');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 初始化新 chat session
  const initChatSession = useCallback(async () => {
    // 如果已经有 chat_id，不需要重新创建
    if (chatId) return chatId;

    try {
      const res = await authFetch('/api/v1/chat', {
        method: 'POST',
        body: JSON.stringify({ content: '' })  // 空内容，只为创建 chat
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
  }, [chatId]);

  const deleteChat = useCallback(async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await authFetch(`/api/v1/chat/${idToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // 从历史记录中移除
        setHistory(prev => prev.filter(chat => chat.id !== idToDelete));
        // 如果删除的是当前对话，跳转到新对话
        if (chatId === idToDelete) {
          navigate('/chat');
          resetState();
          setChatId(null);
        }
      }
    } catch (e) {
      console.error('删除对话失败:', e);
    }
  }, [navigate, resetState, chatId]);

  const loadChat = useCallback(async (id: string) => {
    // 先清理现有状态，包括 WebSocket 连接
    cleanupWebSocket();
    setIsTyping(false);
    setProcessingState('idle');
    setMessages([]); // 重置消息列表

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
        // thinking: msg.thinking, // Hide thinking process
        // thinkingCollapsed: msg.thinking ? true : undefined 
      }));
      setMessages(formattedMessages);
    } catch (e) {
      console.error(e);
    }
  }, [cleanupWebSocket]);

  const startNewChat = useCallback(() => {
    navigate('/chat');
    resetState();
    setChatId(null);
  }, [navigate, resetState]);

  // 根据 chatId 加载对话或重置状态（只在 mounted 后执行）
  useEffect(() => {
    if (!isMounted.current) return;

    if (chatId) {
      loadChat(chatId);
    } else {
      resetState();
    }
  }, [chatId, loadChat, resetState]);

  // 组件挂载时获取历史记录并初始化 chat session
  useEffect(() => {
    fetchHistory();
    // 初始化 chat session（如果 URL 中没有指定 chat_id）
    if (!initialChatId) {
      initChatSession();
    }
  }, [fetchHistory, initialChatId, initChatSession]);

  // 组件卸载时清理 WebSocket
  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, [cleanupWebSocket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, processingState]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 如果没有 chat_id，先初始化
    if (!chatId) {
      const newChatId = await initChatSession();
      if (!newChatId) {
        console.error("Failed to create chat session");
        return;
      }
    }

    // 如果已有连接，先关闭
    cleanupWebSocket();

    const newMessage: Message = {
      id: generateId(),
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
      if (process.env.NODE_ENV === 'development') {
        console.log("Current chatId state:", chatId);
      }
      // 延迟一点发送，确保连接完全建立
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const user = getStoredUser();
          if (process.env.NODE_ENV === 'development') {
            console.log("Sending message with:", { chat_id: chatId, user_id: user?.id });
          }
          ws.send(JSON.stringify({
            type: "text_message",
            content: newMessage.content,
            chat_id: chatId,
            user_id: user?.id || null
          }));
        } else {
          console.error("WebSocket not open when trying to send:", ws.readyState);
        }
      }, 300);
    };

    // let currentThinking = "";
    let currentContent = "";
    let isFirstChunk = true;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 只在开发环境打印简短日志，避免频繁打印大数据
        if (process.env.NODE_ENV === 'development') {
          console.log("WS Type:", data.type);
        }
        if (data.type === 'chat_info') {
          setChatId(data.chat_id);
          fetchHistory();
        } else if (data.type === 'status') {
          if (process.env.NODE_ENV === 'development') {
            console.log("Status:", data.content);
          }
          if (data.content === 'analyzing_intent') setProcessingState('analyzing_intent');
          // else if (data.content === 'reasoning') setProcessingState('reasoning'); // Hide reasoning state
          else if (data.content === 'reasoning') setProcessingState('reasoning'); // Show reasoning state
          else if (data.content === 'summarizing' || data.content === 'generating') setProcessingState('summarizing');
        } else if (data.type === 'thinking_chunk') {
          // Ignore thinking chunks
          /*
          currentThinking += data.content;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            // 只有当最后一条消息是 temp-ai 时才更新，否则忽略
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'temp-ai') {
              return prev.map(m => m.id === 'temp-ai' ? { ...m, thinking: currentThinking } : m);
            } else {
              // 不应该出现这种情况，如果出现可能是之前的消息被覆盖了
              // 创建一个新的 temp-ai 消息
              console.log('Creating new temp-ai for thinking_chunk');
              return [...prev, {
                id: 'temp-ai',
                role: 'assistant',
                content: '',
                thinking: currentThinking,
                thinkingCollapsed: false,
                type: 'text',
                timestamp: new Date().toISOString(),
                model: 'deepseek-v3-reasoner'
              }];
            }
          });
          // 推理过程更新时，自动滚动到底部
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 0);
          */
        } else if (data.type === 'thinking_done') {
          // Ignore thinking done
          /*
          // 推理完成，折叠推理过程
          console.log("Thinking done, folding reasoning process");
          setMessages(prev => {
            const hasTempAi = prev.some(m => m.id === 'temp-ai');
            if (!hasTempAi) {
              console.warn('thinking_done received but no temp-ai message exists');
              return prev;
            }
            return prev.map(m => m.id === 'temp-ai' ? { ...m, thinkingCollapsed: true } : m);
          });
          */
        } else if (data.type === 'llm_chunk') {
          if (isFirstChunk) {
            setIsTyping(false);
            isFirstChunk = false;
          }
          currentContent += data.content;
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'temp-ai') {
              return prev.map(m => m.id === 'temp-ai' ? {
                ...m,
                content: currentContent,
                model: data.model || m.model,
                // 确保保留 thinking 字段
                thinking: m.thinking
              } : m);
            } else {
              // 如果没有 temp-ai，创建一个新的 assistant 消息
              if (process.env.NODE_ENV === 'development') {
                console.log('Creating temp-ai message for llm_chunk');
              }
              return [...prev, {
                id: 'temp-ai',
                role: 'assistant',
                content: currentContent,
                type: 'text',
                timestamp: new Date().toISOString(),
                model: data.model || 'deepseek-v3-reasoner'
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
      } catch (err) {
        console.error("Error processing message:", err);
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      setProcessingState('idle');
      // 显示错误消息
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.id === 'temp-ai') {
          return prev.map(m => m.id === 'temp-ai' ? {
            ...m,
            content: m.content + '\n\n⚠️ 连接出现问题，请重试。'
          } : m);
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

    ws.onclose = (e) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("WebSocket closed:", e.code, e.reason);
      }
      // 如果连接正常关闭且不是错误状态，不做处理
    };
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col p-4">
        <button
          onClick={startNewChat}
          disabled={isTyping}
          className={`flex items-center justify-center w-full px-4 py-2 rounded-lg transition-colors mb-6 shadow-sm ${isTyping
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800'
            }`}
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
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm truncate transition-colors ${isTyping
                ? 'opacity-50 cursor-not-allowed'
                : chatId === chat.id
                  ? 'bg-white text-black shadow-sm font-medium'
                  : 'text-gray-600 hover:bg-gray-200/50'
                }`}
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
                          <StreamMarkdown content={msg.content} />
                        )}
                      </div>

                      {/* 渲染推理过程 */}
                      {/* {msg.thinking && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div
                      className="text-xs text-purple-600 font-medium flex items-center mb-2 cursor-pointer select-none"
                      onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, thinkingCollapsed: !m.thinkingCollapsed } : m))}
                    >
                      <Cpu className={`h-3 w-3 mr-2 ${!msg.thinkingCollapsed ? 'animate-spin' : ''}`} />
                      {msg.thinkingCollapsed ? '查看深度推理过程' : '隐藏深度推理过程'}
                    </div>

                    {!msg.thinkingCollapsed && (
                      <div className="text-xs text-gray-500 font-mono bg-purple-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{msg.thinking}</pre>
                      </div>
                    )}
                  </div>
                )} */}

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
                  const isLastAssistant = lastMsg && lastMsg.role === 'assistant';

                  if (isFinal) {
                    setIsTyping(false);
                    setProcessingState('idle');
                    if (isLastAssistant) {
                      return prev.map((msg, idx) => idx === prev.length - 1 ? { ...msg, content: text } : msg);
                    } else {
                      return [...prev, {
                        id: generateId(),
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
                        id: generateId(),
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