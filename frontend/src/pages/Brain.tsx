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
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-4xl font-light tracking-tight">
            分析与意图
          </h1>
          <p className="text-sm text-muted-foreground">理解您的教学目标并构建内容结构。</p>
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass p-4 rounded-2xl border border-white/20 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-black text-white rounded-lg mr-3">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-medium">核心意图</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <Users className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-medium">受众</span>
                  <p className="text-sm">{mockAnalysis.intent.audience}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-medium">时长</span>
                  <p className="text-sm">{mockAnalysis.intent.duration} 分钟</p>
                </div>
              </div>

              <div className="flex items-start">
                <Layers className="h-4 w-4 text-gray-400 mt-1 mr-2" />
                <div>
                  <span className="text-xs text-gray-400 block uppercase tracking-wider font-medium">风格</span>
                  <p className="text-sm">{mockAnalysis.intent.style}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl border border-white/20 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gray-100 text-black rounded-lg mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-medium">生成结构</h2>
            </div>

            <div className="space-y-3 relative">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100"></div>
              {mockAnalysis.structure.map((item, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute left-0 top-0 w-5 h-5 bg-white border-2 border-black rounded-full flex items-center justify-center z-10">
                    <span className="text-[8px] font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">{item.section}</h3>
                  <ul className="space-y-0.5">
                    {item.points.map((point, i) => (
                      <li key={i} className="text-muted-foreground text-xs flex items-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mr-1.5"></div>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass p-3 rounded-2xl border border-green-100 bg-green-50/50 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-green-900 text-sm">准备生成</h3>
              <p className="text-xs text-green-700">所有关键点已映射到可用素材。</p>
            </div>
          </div>
          <button className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 text-sm transition-colors">
            生成内容
          </button>
        </div>
      </div>
    </div>
  );
}
