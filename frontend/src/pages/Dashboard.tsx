import { Plus, BookOpen, Clock, ArrowRight, Zap, Menu, Home, MessageSquare, Database, BrainCircuit, Layers, Sun, Moon, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FadeIn, SlideUp, StaggerContainer, ScaleIn } from '@/components/ui/motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useUser } from '@/context/UserContext';

export function Dashboard() {
  const { user, logout } = useUser();
  const userInfo = user || { username: '访客', avatar_url: undefined };
  const isMobile = useIsMobile();
  const { theme } = useTheme();
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
          <span className="font-medium text-lg tracking-tight">工作台</span>
          <div className="w-8" /> {/* Placeholder for balance */}
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
                    className="flex items-center w-full px-4 py-3 rounded-xl bg-muted shadow-sm ring-1 ring-border font-medium text-foreground transition-all text-sm"
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
                    className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all text-sm"
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
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth pb-24">
          <FadeIn delay={0.1}>
            <h1 className="text-3xl font-light tracking-tight text-foreground mb-2">
              欢迎回来 ,
            </h1>
            <p className="text-xl font-medium text-primary mb-8">{userInfo.username}</p>
          </FadeIn>

          <div className="space-y-4 mb-8">
            <ScaleIn>
              <NavLink to="/interface">
                <div className="glass p-6 rounded-2xl border border-border shadow-sm active:scale-98 transition-transform relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-muted to-transparent rounded-full -mr-12 -mt-12 opacity-30"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mr-4 shadow-sm">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">新建课程</h3>
                      <p className="text-sm text-muted-foreground">AI 辅助创建教学计划</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </NavLink>
            </ScaleIn>

            <ScaleIn delay={0.1}>
              <NavLink to="/knowledgeBase">
                <div className="glass p-6 rounded-2xl border border-border shadow-sm active:scale-98 transition-transform relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-12 -mt-12 opacity-30 dark:from-blue-900/20"></div>
                  <div className="relative z-10 flex items-center">
                    <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground">知识库</h3>
                      <p className="text-sm text-muted-foreground">管理教材素材</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </NavLink>
            </ScaleIn>

            <ScaleIn delay={0.2}>
              <div className="glass p-6 rounded-2xl border border-border shadow-sm active:scale-98 transition-transform relative overflow-hidden">
                <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-green-50 to-transparent rounded-full -mr-12 -mt-12 opacity-30 dark:from-green-900/20"></div>
                <div className="relative z-10 flex items-center">
                  <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4 shadow-sm dark:bg-green-900/30 dark:text-green-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground">最近项目</h3>
                    <p className="text-sm text-muted-foreground">继续编辑物理101</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </ScaleIn>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">最近活动</h2>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">查看全部</button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SlideUp key={i}>
                  <div className="flex items-center p-4 glass rounded-xl border border-border shadow-sm">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg flex items-center justify-center border border-border mr-4">
                      <span className="font-bold text-sm text-muted-foreground">P{i}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">物理章节 {i}</h4>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                        2小时前编辑
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-1 bg-muted rounded-full text-muted-foreground flex-shrink-0 ml-2">草稿</span>
                  </div>
                </SlideUp>
              ))}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 container mx-auto max-w-7xl custom-scrollbar">
      <div className="space-y-12 pb-12">
        <header>
          <FadeIn delay={0.1}>
            <h1 className="text-5xl font-light tracking-tight text-foreground">
              欢迎回来 , <span className="font-medium">{userInfo.username}</span>
            </h1>
            <p className="mt-4 text-xl text-muted-foreground">
              今天您想创作什么？
            </p>
          </FadeIn>
        </header>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.1} delay={0.2}>
          <ScaleIn>
            <NavLink to="/interface">
              <div className="h-full glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-muted to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="h-12 w-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-medium mb-2 text-foreground">新建课程</h3>
                  <p className="text-muted-foreground mb-6">从零开始或使用 AI 辅助创建新的教学计划。</p>

                  <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 text-foreground">
                    开始创作 <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </NavLink>
          </ScaleIn>

          <ScaleIn>
            <NavLink to="/knowledgeBase">
              <div className="h-full glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700 dark:from-blue-900/20"></div>

                <div className="relative z-10">
                  <div className="h-12 w-12 bg-muted text-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-medium mb-2 text-foreground">知识库</h3>
                  <p className="text-muted-foreground mb-6">管理您的教材、论文和视频素材。</p>

                  <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 text-foreground">
                    管理文件 <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </NavLink>
          </ScaleIn>

          <ScaleIn>
            <div className="h-full glass p-8 rounded-2xl border border-border hover:border-primary/20 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-green-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700 dark:from-green-900/20"></div>

              <div className="relative z-10">
                <div className="h-12 w-12 bg-muted text-foreground rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-medium mb-2 text-foreground">最近项目</h3>
                <p className="text-muted-foreground mb-6">继续编辑"物理101"及其他项目。</p>

                <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 text-foreground">
                  查看全部 <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </ScaleIn>
        </StaggerContainer>

        <div className="mt-12">
          <FadeIn delay={0.4} className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light text-foreground">最近活动</h2>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">查看历史记录</button>
          </FadeIn>

          <StaggerContainer className="space-y-4" delay={0.5}>
            {[1, 2, 3].map((i) => (
              <SlideUp key={i}>
                <div className="flex items-center justify-between p-4 glass rounded-xl border border-border hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted/50 rounded-xl flex items-center justify-center group-hover:bg-background transition-colors border border-transparent group-hover:border-border">
                      <span className="font-bold text-muted-foreground">P{i}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-lg text-foreground">物理章节 {i}</h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                        2小时前编辑
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-medium px-3 py-1 bg-muted rounded-full text-muted-foreground">草稿</span>
                    <button className="text-sm font-medium px-4 py-2 rounded-lg bg-transparent hover:bg-primary hover:text-primary-foreground transition-all border border-transparent hover:border-primary/10">
                      打开
                    </button>
                  </div>
                </div>
              </SlideUp>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </div>
  );
}
