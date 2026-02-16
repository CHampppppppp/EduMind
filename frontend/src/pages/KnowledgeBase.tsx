import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Video, MoreHorizontal, Loader2 } from 'lucide-react';
import type { KnowledgeItem } from '@/types';

export function KnowledgeBase() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setItems([]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
             setIsUploading(false);
             // Add a new mock item
             const newItem: KnowledgeItem = {
               id: Date.now().toString(),
               title: "高等量子力学.pdf",
               type: 'pdf',
               url: "#",
               uploadDate: new Date().toISOString(),
               status: 'processing',
               summary: "正在分析内容..."
             };
             setItems(prev => [newItem, ...prev]);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-8 relative min-h-full">
      <header className="flex justify-between items-center">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-light tracking-tight"
          >
            知识库
          </motion.h1>
          <p className="mt-2 text-muted-foreground">管理您的教学素材和资源。</p>
        </div>
        <button 
          onClick={handleUpload}
          disabled={isUploading}
          className="bg-black text-white px-6 py-3 rounded-xl font-medium flex items-center hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
          {isUploading ? '正在上传...' : '上传新文件'}
        </button>
      </header>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {isUploading && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="fixed bottom-8 right-8 w-80 bg-white border border-gray-200 shadow-xl rounded-2xl p-4 z-50"
           >
             <div className="flex justify-between items-center mb-2">
               <span className="font-medium text-sm">正在上传文件...</span>
               <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
             </div>
             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-black"
                 initial={{ width: 0 }}
                 animate={{ width: `${uploadProgress}%` }}
               />
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4"
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div 
                key={item.id}
                layoutId={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group glass p-6 rounded-xl border border-white/20 hover:border-black/10 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${item.type === 'pdf' ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                    {item.type === 'pdf' ? <FileText className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(item.uploadDate).toLocaleDateString()} • {item.summary}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                    item.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    {item.status === 'ready' ? '就绪' : '处理中'}
                  </span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
