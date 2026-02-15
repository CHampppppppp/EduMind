import { motion } from 'framer-motion';
import { Target, Users, Clock, Layers, FileText, CheckCircle, Sparkles, Cpu } from 'lucide-react';
import type { AIModel } from '@/types';

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
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-light tracking-tight"
          >
            分析与意图
          </motion.h1>
          <p className="mt-2 text-muted-foreground">理解您的教学目标并构建内容结构。</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-sm text-gray-600">
          <span className="text-gray-400">分析模型:</span>
          {mockAnalysis.modelUsed === 'kimi-k2.5' ? (
            <div className="flex items-center text-blue-600 font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              Kimi K2.5
            </div>
          ) : (
            <div className="flex items-center text-purple-600 font-medium">
              <Cpu className="h-3 w-3 mr-1" />
              DeepSeek V4
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Intent Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-2xl border border-white/20 shadow-sm"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-black text-white rounded-xl mr-4">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium">核心意图</h2>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <Users className="h-5 w-5 text-gray-400 mt-1 mr-3" />
              <div>
                <span className="text-sm text-gray-400 block uppercase tracking-wider font-medium">受众</span>
                <p className="text-lg">{mockAnalysis.intent.audience}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-400 mt-1 mr-3" />
              <div>
                <span className="text-sm text-gray-400 block uppercase tracking-wider font-medium">时长</span>
                <p className="text-lg">{mockAnalysis.intent.duration} 分钟</p>
              </div>
            </div>

            <div className="flex items-start">
              <Layers className="h-5 w-5 text-gray-400 mt-1 mr-3" />
              <div>
                <span className="text-sm text-gray-400 block uppercase tracking-wider font-medium">风格</span>
                <p className="text-lg">{mockAnalysis.intent.style}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Structure Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-8 rounded-2xl border border-white/20 shadow-sm"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gray-100 text-black rounded-xl mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium">生成结构</h2>
          </div>

          <div className="space-y-6 relative">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100"></div>
            {mockAnalysis.structure.map((item, index) => (
              <div key={index} className="relative pl-10">
                <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center z-10">
                  <span className="text-[10px] font-bold">{index + 1}</span>
                </div>
                <h3 className="text-lg font-medium mb-1">{item.section}</h3>
                <ul className="space-y-1">
                  {item.points.map((point, i) => (
                    <li key={i} className="text-muted-foreground text-sm flex items-center">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass p-6 rounded-2xl border border-green-100 bg-green-50/50 flex items-center justify-between"
      >
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 mr-4" />
          <div>
            <h3 className="font-medium text-green-900">准备生成</h3>
            <p className="text-sm text-green-700">所有关键点已映射到可用素材。</p>
          </div>
        </div>
        <button className="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
          生成内容
        </button>
      </motion.div>
    </div>
  );
}
