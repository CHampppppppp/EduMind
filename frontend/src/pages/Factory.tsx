import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Edit2, X, Send, Sparkles } from 'lucide-react';
import type { GeneratedContent } from '@/types';
import contentMock from '@/mocks/content.json';
import { GamePreview } from '@/components/GamePreview';

export function Factory() {
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [view, setView] = useState<'slides' | 'lesson' | 'game'>('slides');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    setContent(contentMock as unknown as GeneratedContent);
  }, []);

  if (!content) return <div>加载中...</div>;

  const slide = content.slides[currentSlide];

  const handleModify = () => {
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI modification
    setTimeout(() => {
      setIsGenerating(false);
      setEditPrompt('');
      setIsEditMode(false);
      // Here you would update the content state with the new slide content
      alert("修改已应用: " + editPrompt);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <header className="mb-6 flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight">课件工厂</h1>
          <p className="text-sm text-muted-foreground">预览并导出生成的教学材料。</p>
        </div>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('slides')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'slides' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            演示文稿
          </button>
          <button 
            onClick={() => setView('lesson')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'lesson' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            教案
          </button>
          <button 
            onClick={() => setView('game')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'game' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            互动游戏
          </button>
        </div>
        <button className="bg-black text-white px-4 py-2 rounded-xl flex items-center hover:bg-gray-800 transition-colors shadow-sm">
          <Download className="mr-2 h-4 w-4" />
          导出
        </button>
      </header>

      <div className="flex-1 overflow-hidden relative flex">
        <AnimatePresence mode="wait">
          {view === 'slides' && (
            <motion.div 
              key="slides"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full w-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 p-8 relative overflow-hidden transition-all duration-300"
            >
              <div className="aspect-video w-full max-w-4xl bg-white shadow-2xl rounded-xl flex flex-col p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <div className="text-9xl font-bold">0{currentSlide + 1}</div>
                </div>
                
                <h2 className="text-5xl font-bold mb-8 tracking-tight">{slide.title}</h2>
                <div className="prose prose-lg max-w-none flex-1">
                  <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-wrap">{slide.content}</p>
                </div>
                
                {slide.image && (
                   <div className="mt-4 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      [图片占位符: {slide.image}]
                   </div>
                )}

                <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between text-sm text-gray-400 uppercase tracking-widest">
                  <span>EduMind 生成器</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="absolute bottom-8 flex space-x-4 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-200 z-10">
                <button 
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-3 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <span className="flex items-center font-medium px-4 min-w-[3rem] justify-center">
                  {currentSlide + 1} / {content.slides.length}
                </span>
                <button 
                  onClick={() => setCurrentSlide(prev => Math.min(content.slides.length - 1, prev + 1))}
                  disabled={currentSlide === content.slides.length - 1}
                  className="p-3 hover:bg-gray-100 rounded-full disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`absolute top-8 right-8 p-3 rounded-xl transition-all shadow-sm border group z-10 ${isEditMode ? 'bg-black text-white border-black' : 'bg-white/80 backdrop-blur-md border-gray-200 hover:bg-white'}`}
              >
                {isEditMode ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5 text-gray-500 group-hover:text-black" />}
              </button>
              
              {/* Modification Overlay */}
              <AnimatePresence>
                {isEditMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute top-20 right-8 w-96 glass p-4 rounded-2xl border border-white/20 shadow-xl z-20"
                  >
                    <div className="flex items-center mb-3 text-sm font-medium text-gray-500">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      AI 修改
                    </div>
                    <div className="relative">
                      <textarea 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="描述如何修改此幻灯片（例如：“简化文本”，“添加一张猫的图片”）..."
                        className="w-full bg-white/50 border border-gray-200 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none h-24"
                        disabled={isGenerating}
                      />
                      <button 
                        onClick={handleModify}
                        disabled={!editPrompt.trim() || isGenerating}
                        className="absolute bottom-3 right-3 p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'lesson' && (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full w-full overflow-y-auto bg-white rounded-2xl border border-gray-200 p-12 shadow-sm max-w-4xl mx-auto"
            >
              <article className="prose prose-slate max-w-none">
                <div dangerouslySetInnerHTML={{ __html: content.lessonPlan.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1 class="text-4xl font-bold mb-6">$1</h1>').replace(/## (.*)/g, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>') }} />
              </article>
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-full w-full flex items-center justify-center"
            >
              <div className="w-full max-w-3xl">
                 <GamePreview />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
