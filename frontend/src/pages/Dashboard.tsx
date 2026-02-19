import { Plus, BookOpen, Clock, ArrowRight, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { FadeIn, SlideUp, StaggerContainer, ScaleIn } from '@/components/ui/motion';

export function Dashboard() {
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

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
              <div className="h-full glass dark:glass-dark p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden dark:border-white/10 dark:hover:border-white/20">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700 dark:from-gray-900"></div>

                <div className="relative z-10">
                  <div className="h-12 w-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform dark:bg-white dark:text-black">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-medium mb-2 dark:text-white">新建课程</h3>
                  <p className="text-muted-foreground mb-6">从零开始或使用 AI 辅助创建新的教学计划。</p>

                  <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 dark:text-white">
                    开始创作 <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </NavLink>
          </ScaleIn>

          <ScaleIn>
            <NavLink to="/knowledgeBase">
              <div className="h-full glass dark:glass-dark p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden dark:border-white/10 dark:hover:border-white/20">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700 dark:from-blue-900/20"></div>

                <div className="relative z-10">
                  <div className="h-12 w-12 bg-gray-100 text-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform dark:bg-white/10 dark:text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-medium mb-2 dark:text-white">知识库</h3>
                  <p className="text-muted-foreground mb-6">管理您的教材、论文和视频素材。</p>

                  <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 dark:text-white">
                    管理文件 <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </NavLink>
          </ScaleIn>

          <ScaleIn>
            <div className="h-full glass dark:glass-dark p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden dark:border-white/10 dark:hover:border-white/20">
              <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-green-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700 dark:from-green-900/20"></div>

              <div className="relative z-10">
                <div className="h-12 w-12 bg-gray-100 text-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform dark:bg-white/10 dark:text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-medium mb-2 dark:text-white">最近项目</h3>
                <p className="text-muted-foreground mb-6">继续编辑"物理101"及其他项目。</p>

                <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 dark:text-white">
                  查看全部 <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </div>
          </ScaleIn>
        </StaggerContainer>

        <div className="mt-12">
          <FadeIn delay={0.4} className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light dark:text-white">最近活动</h2>
            <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors dark:text-gray-400 dark:hover:text-white">查看历史记录</button>
          </FadeIn>

          <StaggerContainer className="space-y-4" delay={0.5}>
            {[1, 2, 3].map((i) => (
              <SlideUp key={i}>
                <div className="flex items-center justify-between p-4 glass dark:glass-dark rounded-xl border border-white/10 hover:bg-white/50 transition-colors group dark:hover:bg-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 dark:bg-white/5 dark:group-hover:bg-white/10 dark:group-hover:border-white/10">
                      <span className="font-bold text-gray-400">P{i}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-lg dark:text-white">物理章节 {i}</h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                        2小时前编辑
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600 dark:bg-white/10 dark:text-gray-300">草稿</span>
                    <button className="text-sm font-medium px-4 py-2 rounded-lg bg-transparent hover:bg-black hover:text-white transition-all border border-transparent hover:border-black/10 dark:hover:bg-white dark:hover:text-black dark:hover:border-white/20 dark:text-white">
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
