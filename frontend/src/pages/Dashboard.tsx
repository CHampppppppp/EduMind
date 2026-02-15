import { motion } from 'framer-motion';
import { Plus, BookOpen, Clock, ArrowRight, Zap } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function Dashboard() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-12 pb-12">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-light tracking-tight text-foreground"
        >
          欢迎回来，<span className="font-medium">老师</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-xl text-muted-foreground"
        >
          今天您想创作什么？
        </motion.p>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <NavLink to="/chat">
          <motion.div 
            variants={item}
            className="h-full glass p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-gray-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="h-12 w-12 bg-black text-white rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-medium mb-2">新建课程</h3>
              <p className="text-muted-foreground mb-6">从零开始或使用 AI 辅助创建新的教学计划。</p>
              
              <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                开始创作 <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </NavLink>

        <NavLink to="/knowledge">
          <motion.div 
            variants={item}
            className="h-full glass p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="h-12 w-12 bg-gray-100 text-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-medium mb-2">知识库</h3>
              <p className="text-muted-foreground mb-6">管理您的教材、论文和视频素材。</p>
              
               <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                管理文件 <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </NavLink>

        <motion.div 
          variants={item}
          className="h-full glass p-8 rounded-2xl border border-white/20 hover:border-black/10 transition-all hover:shadow-xl hover:-translate-y-1 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-green-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10">
            <div className="h-12 w-12 bg-gray-100 text-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-medium mb-2">最近项目</h3>
            <p className="text-muted-foreground mb-6">继续编辑"物理101"及其他项目。</p>
            
             <div className="flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                查看全部 <ArrowRight className="ml-2 h-4 w-4" />
              </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12"
      >
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-light">最近活动</h2>
           <button className="text-sm font-medium text-gray-500 hover:text-black transition-colors">查看历史记录</button>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 glass rounded-xl border border-white/10 hover:bg-white/50 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100">
                  <span className="font-bold text-gray-400">P{i}</span>
                </div>
                <div>
                  <h4 className="font-medium text-lg">物理章节 {i}</h4>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Zap className="h-3 w-3 mr-1 text-yellow-500" /> 
                    2小时前编辑
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                 <span className="text-xs font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">草稿</span>
                 <button className="text-sm font-medium px-4 py-2 rounded-lg bg-transparent hover:bg-black hover:text-white transition-all border border-transparent hover:border-black/10">
                  打开
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
