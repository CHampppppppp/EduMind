import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, Bot, User, Cpu, Sparkles, BrainCircuit } from 'lucide-react';
import type { Message } from '@/types';
import messagesMock from '@/mocks/messages.json';

export function Interface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [processingState, setProcessingState] = useState<'idle' | 'analyzing_intent' | 'reasoning' | 'summarizing'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(messagesMock as Message[]);
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

    // Step 1: Simulate Intent Recognition (Backend)
    setTimeout(() => {
      // Mock logic: check for keywords that require reasoning
      const needsReasoning = /计算|推理|推导|calculate|reason|derive|physics|math|物理|数学/.test(newMessage.content.toLowerCase());
      
      if (needsReasoning) {
        setProcessingState('reasoning');
        
        // Step 2a: DeepSeek Reasoning
        setTimeout(() => {
          setProcessingState('summarizing');
          
          // Step 3a: Kimi Summarization
          setTimeout(() => {
            const aiResponse: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: "基于深度推理分析：\n\n1. **核心概念解构**：学生需要先建立直观的物理模型，再引入数学公式。直接讲公式会导致认知负荷过高。\n2. **教学逻辑推理**：\n   - 第一步：使用滑块实验视频（多模态输入）展示无摩擦运动。\n   - 第二步：引导学生推导 F=ma。\n   - 第三步：对比实验数据。\n3. **建议方案**：采用「预测-观察-解释」的 POE 教学策略。我已为您生成了对应的实验模拟脚本。",
              type: 'text',
              timestamp: new Date().toISOString(),
              model: 'deepseek-v4',
              thinking: "正在分析物理概念... 关联牛顿力学公式... 检索相关教学案例... 优化教学路径..."
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsTyping(false);
            setProcessingState('idle');
          }, 1500);
        }, 2500);
      } else {
        // Step 2b: Standard Kimi Response
        setProcessingState('summarizing'); // Generating answer directly
        setTimeout(() => {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "我已经分析了您的需求。基于上传的《物理学导论.pdf》，建议先讲解牛顿定律，然后再讲解复杂的例子。是否需要我起草一份大纲？",
            type: 'text',
            timestamp: new Date().toISOString(),
            model: 'kimi-k2.5'
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);
          setProcessingState('idle');
        }, 1000);
      }
    }, 1000);
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
                    className={`p-4 rounded-2xl shadow-sm w-full ${
                      msg.role === 'user' 
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
        <button className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-colors">
          <Mic className="h-5 w-5" />
        </button>
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
