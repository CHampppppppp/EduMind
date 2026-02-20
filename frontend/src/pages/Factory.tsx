import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Edit2, X, Send, Sparkles, Box, Loader2, Menu, Home, MessageSquare, Database, BrainCircuit, Layers, Sun, Moon, LogOut } from 'lucide-react';
import type { GeneratedContent } from '@/types';
import { GamePreview } from '@/components/GamePreview';
import { ScaleIn, FadeIn } from '@/components/ui/motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useUser } from '@/context/UserContext';

export function Factory() {
  const { logout } = useUser();
  const { theme } = useTheme();
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [view, setView] = useState<'slides' | 'lesson' | 'game'>('slides');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const handleGenerateExample = () => {
    setIsLoading(true);
    setTimeout(() => {
      setContent({
        id: 'mock-1',
        slides: [
          {
            id: 's1',
            title: '光合作用的奥秘',
            content: '光合作用是植物、藻类和某些细菌利用光能将二氧化碳和水转化为葡萄糖和氧气的过程。\n\n这个过程不仅为植物生长提供能量，也是地球上大多数生命赖以生存的基础。',
            notes: '介绍光合作用的基本定义和重要性。',
            layout: 'title',
            image: 'photosynthesis-diagram'
          },
          {
            id: 's2',
            title: '光反应阶段',
            content: '在叶绿体的类囊体薄膜上进行。\n\n主要发生水的光解和ATP的生成。\n需要光照参与。',
            notes: '详细讲解光反应的场所和物质变化。',
            layout: 'content'
          },
          {
            id: 's3',
            title: '暗反应阶段',
            content: '在叶绿体基质中进行。\n\n利用光反应产生的ATP和NADPH将CO2转化为糖类。\n不需要光照，但依赖光反应产物。',
            notes: '对比光反应，讲解暗反应的过程。',
            layout: 'split'
          }
        ],
        lessonPlan: '# 光合作用教学设计\n\n## 教学目标\n1. 理解光合作用的概念\n2. 掌握光反应和暗反应的区别\n\n## 教学过程\n...',
        games: []
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleModify = () => {
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setEditPrompt('');
      setIsEditMode(false);
      alert("修改已应用: " + editPrompt);
    }, 1500);
  };

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-background overflow-hidden text-foreground">
        {/* Mobile Header */}
        <header className="px-4 py-3 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/40 shrink-0">
          <button onClick={() => setShowMobileMenu(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-medium text-lg tracking-tight">课件工厂</span>
          <button className="p-2 -mr-2 text-primary active:scale-95 transition-transform">
            <Download className="h-6 w-6" />
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 left-0 bottom-0 w-[55%] max-w-[320px] bg-card border-r border-border z-40 shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    E
                  </div>
                  <span className="font-semibold text-lg">EduMind</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <Home className="h-5 w-5 mr-3" />
                    <span className="font-medium">工作台</span>
                  </button>
                  <button
                    onClick={() => navigate('/knowledgeBase')}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <Database className="h-5 w-5 mr-3" />
                    <span className="font-medium">知识库</span>
                  </button>
                  <button
                    onClick={() => navigate('/interface')}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    <span className="font-medium">对话交互</span>
                  </button>
                  <button
                    onClick={() => navigate('/brain')}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <BrainCircuit className="h-5 w-5 mr-3" />
                    <span className="font-medium">意图理解</span>
                  </button>
                  <button
                    onClick={() => navigate('/factory')}
                    className="flex items-center w-full px-4 py-3 rounded-xl bg-muted shadow-sm ring-1 ring-border font-medium text-foreground transition-all text-sm"
                  >
                    <Layers className="h-5 w-5 mr-3" />
                    <span className="font-medium">课件工厂</span>
                  </button>
                </div>

                <div className="p-4 border-t border-border space-y-2 mt-auto">
                  <AnimatedThemeToggler
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
                    <span className="font-medium">
                      {theme === 'dark' ? '切换亮色' : '切换暗色'}
                    </span>
                  </AnimatedThemeToggler>

                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">退出登录</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth pb-24 bg-muted/10 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-[60vh]">
              <div className="bg-card p-4 rounded-full shadow-lg border border-border animate-bounce">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground font-medium animate-pulse">正在生成教学内容...</p>
            </div>
          ) : !content ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 min-h-[60vh]">
              <div className="bg-muted p-6 rounded-full ring-1 ring-border shadow-sm">
                <Box className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-light text-foreground">暂无生成内容</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  您的教学材料工厂目前是空的。<br />
                  请前往对话页面生成内容。
                </p>
              </div>
              <button
                onClick={handleGenerateExample}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 flex items-center text-sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                生成示例内容
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Mobile View Switcher */}
              <div className="px-4 py-3 bg-background border-b border-border/50 sticky top-0 z-10 flex space-x-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setView('slides')}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'slides' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  幻灯片
                </button>
                <button
                  onClick={() => setView('lesson')}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'lesson' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  教案
                </button>
                <button
                  onClick={() => setView('game')}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'game' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}
                >
                  互动游戏
                </button>
              </div>

              <div className="flex-1 p-4">
                <AnimatePresence mode="wait">
                  {view === 'slides' && (
                    <motion.div
                      key="slides"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="aspect-video w-full bg-card shadow-lg rounded-xl flex flex-col p-6 relative overflow-hidden border border-border">
                        <div className="absolute top-4 right-4 opacity-10">
                          <div className="text-5xl font-bold text-foreground">0{currentSlide + 1}</div>
                        </div>
                        <h2 className="text-xl font-bold mb-4 tracking-tight text-card-foreground line-clamp-2">{content.slides[currentSlide].title}</h2>
                        <div className="prose prose-sm max-w-none flex-1 dark:prose-invert overflow-y-auto custom-scrollbar">
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-xs">{content.slides[currentSlide].content}</p>
                        </div>
                      </div>

                      {/* Mobile Slide Controls */}
                      <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border shadow-sm">
                        <button
                          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                          disabled={currentSlide === 0}
                          className="p-3 hover:bg-muted rounded-lg disabled:opacity-30 transition-colors text-foreground"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="font-medium text-sm text-muted-foreground">
                          {currentSlide + 1} / {content.slides.length}
                        </span>
                        <button
                          onClick={() => setCurrentSlide(prev => Math.min(content.slides.length - 1, prev + 1))}
                          disabled={currentSlide === content.slides.length - 1}
                          className="p-3 hover:bg-muted rounded-lg disabled:opacity-30 transition-colors text-foreground"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Mobile AI Edit */}
                      <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center mb-2 text-sm font-medium text-muted-foreground">
                          <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                          AI 修改当前页
                        </div>
                        <div className="relative flex items-center">
                          <input
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="输入修改指令..."
                            className="flex-1 bg-muted/50 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary/20 outline-none"
                            disabled={isGenerating}
                          />
                          <button
                            onClick={handleModify}
                            disabled={!editPrompt.trim() || isGenerating}
                            className="ml-2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {view === 'lesson' && (
                    <motion.div
                      key="lesson"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-card rounded-xl border border-border p-6 shadow-sm"
                    >
                      <article className="prose prose-sm dark:prose-invert max-w-none text-card-foreground">
                        <div dangerouslySetInnerHTML={{ __html: content.lessonPlan.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1 class="text-xl font-bold mb-4 text-foreground">$1</h1>').replace(/## (.*)/g, '<h2 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h2>') }} />
                      </article>
                    </motion.div>
                  )}

                  {view === 'game' && (
                    <motion.div
                      key="game"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="w-full bg-card rounded-xl border border-border overflow-hidden shadow-sm min-h-[300px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground p-8 text-center">移动端暂不支持预览互动游戏，请在 PC 端查看。</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  if (isLoading) {
    return (
      <FadeIn className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="bg-card p-4 rounded-full shadow-lg border border-border animate-bounce">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">正在生成教学内容...</p>
      </FadeIn>
    );
  }

  if (!content) {
    return (
      <ScaleIn className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="bg-muted p-8 rounded-full ring-1 ring-border shadow-sm">
          <Box className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <div className="max-w-md space-y-3">
          <h3 className="text-2xl font-light text-foreground">暂无生成内容</h3>
          <p className="text-muted-foreground leading-relaxed">
            您的教学材料工厂目前是空的。<br />
            请前往对话页面生成内容，或点击下方按钮查看示例。
          </p>
        </div>
        <button
          onClick={handleGenerateExample}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/10 flex items-center group"
        >
          <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
          生成示例内容
        </button>
      </ScaleIn>
    );
  }

  const slide = content.slides[currentSlide];

  return (
    <div className="h-full flex flex-col p-8 container mx-auto max-w-7xl custom-scrollbar">
      <FadeIn delay={0.1} className="mb-6 flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">课件工厂</h1>
          <p className="text-sm text-muted-foreground">预览并导出生成的教学材料。</p>
        </div>
        <div className="flex space-x-2 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setView('slides')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'slides' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            演示文稿
          </button>
          <button
            onClick={() => setView('lesson')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'lesson' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            教案
          </button>
          <button
            onClick={() => setView('game')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'game' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            互动游戏
          </button>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl flex items-center hover:bg-primary/90 transition-colors shadow-sm">
          <Download className="mr-2 h-4 w-4" />
          导出
        </button>
      </FadeIn>

      <div className="flex-1 overflow-hidden relative flex">
        <AnimatePresence mode="wait">
          {view === 'slides' && (
            <motion.div
              key="slides"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border p-8 relative overflow-hidden"
            >
              <div className="aspect-video w-full max-w-4xl bg-card shadow-2xl rounded-xl flex flex-col p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <div className="text-9xl font-bold text-foreground">0{currentSlide + 1}</div>
                </div>

                <h2 className="text-5xl font-bold mb-8 tracking-tight text-card-foreground">{slide.title}</h2>
                <div className="prose prose-lg max-w-none flex-1 dark:prose-invert">
                  <p className="text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap">{slide.content}</p>
                </div>

                {slide.image && (
                  <div className="mt-4 h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    [图片占位符: {slide.image}]
                  </div>
                )}

                <div className="mt-auto pt-8 border-t border-border flex justify-between text-sm text-muted-foreground uppercase tracking-widest">
                  <span>EduMind 生成器</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="absolute bottom-8 flex space-x-4 bg-card/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-border z-10">
                <button
                  onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="p-3 hover:bg-muted rounded-full disabled:opacity-30 transition-colors text-foreground"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <span className="flex items-center font-medium px-4 min-w-[3rem] justify-center text-foreground">
                  {currentSlide + 1} / {content.slides.length}
                </span>
                <button
                  onClick={() => setCurrentSlide(prev => Math.min(content.slides.length - 1, prev + 1))}
                  disabled={currentSlide === content.slides.length - 1}
                  className="p-3 hover:bg-muted rounded-full disabled:opacity-30 transition-colors text-foreground"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`absolute top-8 right-8 p-3 rounded-xl transition-all shadow-sm border group z-10 ${isEditMode ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/80 backdrop-blur-md border-border hover:bg-card'}`}
              >
                {isEditMode ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />}
              </button>

              <AnimatePresence>
                {isEditMode && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-20 right-8 w-96 glass p-4 rounded-2xl border border-border shadow-xl z-20"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                      AI 修改
                    </div>
                    <div className="relative">
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="描述如何修改此幻灯片..."
                        className="w-full bg-background/50 border border-border rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/5 resize-none h-24 text-foreground"
                        disabled={isGenerating}
                      />
                      <button
                        onClick={handleModify}
                        disabled={!editPrompt.trim() || isGenerating}
                        className="absolute bottom-3 right-3 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full overflow-y-auto bg-card rounded-2xl border border-border p-12 shadow-sm max-w-4xl mx-auto"
            >
              <article className="prose prose-slate dark:prose-invert max-w-none text-card-foreground">
                <div dangerouslySetInnerHTML={{ __html: content.lessonPlan.replace(/\n/g, '<br/>').replace(/# (.*)/g, '<h1 class="text-4xl font-bold mb-6 text-foreground">$1</h1>').replace(/## (.*)/g, '<h2 class="text-2xl font-semibold mt-8 mb-4 text-foreground">$1</h2>') }} />
              </article>
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
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
