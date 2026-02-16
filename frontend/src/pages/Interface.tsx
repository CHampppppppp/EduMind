import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, Bot, User, Cpu, Sparkles, BrainCircuit } from 'lucide-react';
import type { Message } from '@/types';
import { VoiceInput } from '@/components/VoiceInput';

export function Interface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing_intent' | 'reasoning' | 'summarizing'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // setMessages(messagesMock as Message[]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, processingState]);

  const handleSend = () => {
    if (!input.trim()) return;

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

    // Use WebSocket for Text Chat to support streaming!
    // We can reuse the VoiceInput component's logic or a separate hook, but for now
    // let's manually send via a temporary WebSocket connection for text chat streaming.
    // Ideally, the whole chat interface should be WebSocket based.

    const ws = new WebSocket('ws://localhost:8000/api/v1/chat/ws');

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "text_message",
        content: newMessage.content
      }));
    };

    let currentThinking = "";
    let currentContent = "";
    let isFirstChunk = true;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'status') {
        // Map backend status to frontend state
        if (data.content === 'analyzing_intent') setProcessingState('analyzing_intent');
        else if (data.content === 'reasoning') setProcessingState('reasoning');
        else if (data.content === 'summarizing' || data.content === 'generating') setProcessingState('summarizing');
      } else if (data.type === 'thinking_chunk') {
        currentThinking += data.content;
        // Update thinking state
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === 'temp-ai') {
            return prev.map(m => m.id === 'temp-ai' ? { ...m, thinking: currentThinking } : m);
          } else {
            // Create temp message if not exists
            return [...prev, {
              id: 'temp-ai',
              role: 'assistant',
              content: '',
              thinking: currentThinking,
              type: 'text',
              timestamp: new Date().toISOString(),
              model: 'deepseek-v3-reasoner' // Temporary assumption
            }];
          }
        });
      } else if (data.type === 'llm_chunk') {
        if (isFirstChunk) {
          setIsTyping(false); // Stop "typing" animation, start showing text
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
      } else if (data.type === 'error') {
        console.error("WS Error:", data.content);
        setProcessingState('idle');
        ws.close();
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      setProcessingState('idle');
    };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="mb-6 flex justify-between items-center border-b border-gray-100 pb-4">
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

      <div className="flex-1 overflow-y-auto space-y-8 pr-4 pb-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
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

                <div className="flex flex-col items-start w-full">
                  {msg.role === 'assistant' && msg.model && (
                    <div className="flex items-center space-x-2 mb-1 ml-1">
                      {msg.model === 'deepseek-v4' ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center">
                          <Cpu className="h-3 w-3 mr-1" /> 深度推理 (DeepSeek) + 总结 (Kimi)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center">
                          <Sparkles className="h-3 w-3 mr-1" /> 基座模型 (Kimi)
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl shadow-sm w-full ${msg.role === 'user'
                      ? 'bg-black text-white rounded-br-none'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                  >
                    {msg.thinking && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 italic flex items-start">
                        <Cpu className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0 animate-pulse" />
                        <div>
                          <div className="font-semibold not-italic mb-1 text-gray-600">DeepSeek 推理过程:</div>
                          {msg.thinking}
                        </div>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                  DeepSeek 正在进行深度推理...
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

      <div className="mt-4 glass p-2 rounded-2xl border border-gray-200 flex items-center space-x-2 shadow-lg">
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
              setProcessingState('summarizing'); // Indicate processing
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
                // Chunk
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
  );
}
