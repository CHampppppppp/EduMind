import { Target, Users, Clock, Layers, FileText, CheckCircle, Sparkles, Cpu, Menu, Home, MessageSquare, Database, BrainCircuit, Layers as LayersIcon, Sun, Moon, LogOut } from 'lucide-react';
import type { AIModel } from '@/types';
import { FadeIn, SlideUp, StaggerContainer } from '@/components/ui/motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useUser } from '@/context/UserContext';

const mockAnalysis = {
  intent: {
    topic: "排序算法导论",
    audience: "计算机科学专业大一新生",
    duration: 45,
    keyPoints: [
      "算法复杂度的概念",
      "冒泡排序机制",
      "实践可视化",
      "与高效算法的比较"
    ],
    style: "互动与可视化"
  },
  structure: [
    { section: "引言", points: ["为什么我们需要排序？", "现实世界的例子"] },
    { section: "冒泡排序", points: ["逐步演示", "互动演示"] },
    { section: "复杂度分析", points: ["大O表示法", "最好/最坏情况"] },
    { section: "结论", points: ["总结", "下一步（归并排序）"] }
  ],
  modelUsed: 'kimi-k2.5' as AIModel
};

export function Brain() {
  const { logout } = useUser();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex flex-col h-[100dvh] w-full bg-background overflow-hidden text-foreground">
        {/* Mobile Header */}
        <header className="px-4 py-3 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/40 shrink-0">
          <button onClick={() => setShowMobileMenu(true)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-medium text-lg tracking-tight">意图理解</span>
          <div className="w-8" />
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
                    className="flex items-center w-full px-4 py-3 rounded-xl bg-muted shadow-sm ring-1 ring-border font-medium text-foreground transition-all text-sm"
                  >
                    <BrainCircuit className="h-5 w-5 mr-3" />
                    <span className="font-medium">意图理解</span>
                  </button>
                  <button
                    onClick={() => navigate('/factory')}
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
                  >
                    <LayersIcon className="h-5 w-5 mr-3" />
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar scroll-smooth pb-24">
          <div className="flex items-center justify-between space-x-2 bg-card px-3 py-2 rounded-xl border border-border shadow-sm text-sm text-muted-foreground mb-4">
            <span className="text-muted-foreground/70">当前分析模型</span>
            {mockAnalysis.modelUsed === 'kimi-k2.5' ? (
              <div className="flex items-center text-blue-600 font-medium dark:text-blue-400">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Kimi K2.5
              </div>
            ) : (
              <div className="flex items-center text-purple-600 font-medium dark:text-purple-400">
                <Cpu className="h-3.5 w-3.5 mr-1.5" />
                DeepSeek V4
              </div>
            )}
          </div>

          <StaggerContainer delay={0.1} className="space-y-4">
            <SlideUp className="glass p-5 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg mr-3 shadow-sm">
                  <Target className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-foreground">核心意图</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold mb-0.5">受众</span>
                    <p className="text-sm text-foreground leading-relaxed">{mockAnalysis.intent.audience}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold mb-0.5">时长</span>
                    <p className="text-sm text-foreground leading-relaxed">{mockAnalysis.intent.duration} 分钟</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Layers className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-semibold mb-0.5">风格</span>
                    <p className="text-sm text-foreground leading-relaxed">{mockAnalysis.intent.style}</p>
                  </div>
                </div>
              </div>
            </SlideUp>

            <SlideUp className="glass p-5 rounded-2xl border border-border shadow-sm" delay={0.2}>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-muted text-foreground rounded-lg mr-3 shadow-sm border border-border">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-foreground">生成结构</h2>
              </div>

              <div className="space-y-4 relative pl-2">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border/50"></div>
                {mockAnalysis.structure.map((item, index) => (
                  <div key={index} className="relative pl-8">
                    <div className="absolute left-0 top-0 w-4 h-4 bg-background border-2 border-primary rounded-full flex items-center justify-center z-10 text-foreground translate-x-[-1px]">
                      <span className="text-[8px] font-bold">{index + 1}</span>
                    </div>
                    <h3 className="text-sm font-medium mb-1.5 text-foreground">{item.section}</h3>
                    <ul className="space-y-1.5">
                      {item.points.map((point, i) => (
                        <li key={i} className="text-muted-foreground text-xs flex items-start leading-relaxed">
                          <div className="w-1 h-1 bg-muted-foreground/50 rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </SlideUp>
          </StaggerContainer>

          <FadeIn delay={0.3} className="glass p-4 rounded-xl border border-green-200/50 bg-green-50/80 dark:border-green-900/30 dark:bg-green-900/20 flex flex-col space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-200 text-sm">准备生成</h3>
                <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-0.5">所有关键点已映射到可用素材。</p>
              </div>
            </div>
            <button className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm active:scale-[0.98]">
              生成内容
            </button>
          </FadeIn>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn delay={0.1} className="px-8 py-6 flex justify-between items-center border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-foreground">
            分析与意图
          </h1>
          <p className="text-sm text-muted-foreground">理解您的教学目标并构建内容结构。</p>
        </div>

        <div className="flex items-center space-x-2 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm text-sm text-muted-foreground">
          <span className="text-muted-foreground/70">分析模型:</span>
          {mockAnalysis.modelUsed === 'kimi-k2.5' ? (
            <div className="flex items-center text-blue-600 font-medium dark:text-blue-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Kimi K2.5
            </div>
          ) : (
            <div className="flex items-center text-purple-600 font-medium dark:text-purple-400">
              <Cpu className="h-3 w-3 mr-1" />
              DeepSeek V4
            </div>
          )}
        </div>
      </FadeIn>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <StaggerContainer delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SlideUp className="glass dark:glass-dark p-4 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary text-primary-foreground rounded-lg mr-3">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-medium text-foreground">核心意图</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <Users className="h-4 w-4 text-muted-foreground mt-1 mr-2" />
                <div>
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider font-medium">受众</span>
                  <p className="text-sm text-foreground">{mockAnalysis.intent.audience}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-4 w-4 text-muted-foreground mt-1 mr-2" />
                <div>
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider font-medium">时长</span>
                  <p className="text-sm text-foreground">{mockAnalysis.intent.duration} 分钟</p>
                </div>
              </div>

              <div className="flex items-start">
                <Layers className="h-4 w-4 text-muted-foreground mt-1 mr-2" />
                <div>
                  <span className="text-xs text-muted-foreground block uppercase tracking-wider font-medium">风格</span>
                  <p className="text-sm text-foreground">{mockAnalysis.intent.style}</p>
                </div>
              </div>
            </div>
          </SlideUp>

          <SlideUp className="glass p-4 rounded-2xl border border-border shadow-sm" delay={0.2}>
            <div className="flex items-center mb-4">
              <div className="p-2 bg-muted text-foreground rounded-lg mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-medium text-foreground">生成结构</h2>
            </div>

            <div className="space-y-3 relative">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border"></div>
              {mockAnalysis.structure.map((item, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute left-0 top-0 w-5 h-5 bg-background border-2 border-primary rounded-full flex items-center justify-center z-10 text-foreground">
                    <span className="text-[8px] font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1 text-foreground">{item.section}</h3>
                  <ul className="space-y-0.5">
                    {item.points.map((point, i) => (
                      <li key={i} className="text-muted-foreground text-xs flex items-center">
                        <div className="w-1 h-1 bg-muted-foreground/50 rounded-full mr-1.5"></div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SlideUp>
        </StaggerContainer>

        <FadeIn delay={0.4} className="glass dark:glass-dark p-3 rounded-2xl border border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-200 text-sm">准备生成</h3>
              <p className="text-xs text-green-700 dark:text-green-300">所有关键点已映射到可用素材。</p>
            </div>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 text-sm transition-colors">
            生成内容
          </button>
        </FadeIn>
      </div>
    </div>
  );
}
