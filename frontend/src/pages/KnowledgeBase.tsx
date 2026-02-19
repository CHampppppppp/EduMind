import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Upload, FileText, Video, Image as ImageIcon, Music, File as FileIcon, Loader2, Trash2 } from 'lucide-react';
import type { KnowledgeItem } from '@/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { getStoredUser } from '@/lib/auth';
import { FadeIn, SlideUp, StaggerContainer } from '@/components/ui/motion';

export function KnowledgeBase() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = async () => {
    try {
      const user = getStoredUser();
      const headers: Record<string, string> = {};
      if (user && user.id) {
        headers['X-User-Id'] = user.id;
      }

      const response = await fetch('/api/v1/knowledge', { headers });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const user = getStoredUser();
      const headers: Record<string, string> = {};
      if (user && user.id) {
        headers['X-User-Id'] = user.id;
      }

      const response = await fetch('/api/v1/knowledge/upload', {
        method: 'POST',
        body: formData,
        headers
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const newItem = await response.json();
        setItems(prev => [newItem, ...prev]);
      } else {
        console.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 500);
    }
  };

  const handleDelete = async (id: string) => {
    toast("确定要删除这个文件吗？", {
      description: "这将同时删除云端和本地的记录，且无法恢复。",
      action: {
        label: "确认删除",
        onClick: async () => {
          setDeletingId(id);
          try {
            const user = getStoredUser();
            const headers: Record<string, string> = {};
            if (user && user.id) {
              headers['X-User-Id'] = user.id;
            }

            const response = await fetch(`/api/v1/knowledge/${id}`, {
              method: 'DELETE',
              headers
            });

            if (response.ok) {
              setItems(prev => prev.filter(item => item.id !== id));
              toast.success("文件已成功删除");
            } else {
              console.error("Delete failed");
              toast.error("删除失败，请稍后重试");
            }
          } catch (error) {
            console.error("Delete error:", error);
            toast.error("删除过程中发生错误");
          } finally {
            setDeletingId(null);
          }
        }
      },
      cancel: {
        label: "取消",
        onClick: () => { }
      },
      duration: Infinity,
    });
  };

  const getIcon = (type: string) => {
    if (type === 'image') return <ImageIcon className="h-6 w-6" />;
    if (type === 'video') return <Video className="h-6 w-6" />;
    if (type === 'audio') return <Music className="h-6 w-6" />;
    if (type === 'pdf') return <FileText className="h-6 w-6" />;
    return <FileIcon className="h-6 w-6" />;
  };

  const getColorClass = (type: string) => {
    if (type === 'image') return 'bg-purple-50 text-purple-500 group-hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:group-hover:bg-purple-900/30';
    if (type === 'video') return 'bg-blue-50 text-blue-500 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:group-hover:bg-blue-900/30';
    if (type === 'audio') return 'bg-yellow-50 text-yellow-500 group-hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:group-hover:bg-yellow-900/30';
    if (type === 'pdf') return 'bg-red-50 text-red-500 group-hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:group-hover:bg-red-900/30';
    return 'bg-muted text-muted-foreground group-hover:bg-accent';
  };

  return (
    <div className="h-full overflow-y-auto p-8 container mx-auto max-w-7xl custom-scrollbar">
      <div className="space-y-8 relative min-h-full">
        <FadeIn delay={0.1} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-foreground">
              知识库
            </h1>
            <p className="mt-2 text-muted-foreground">管理您的教学素材和资源。</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx"
            />
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium flex items-center hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}
              {isUploading ? '正在上传...' : '上传新文件'}
            </button>
          </div>
        </FadeIn>

        <AnimatePresence>
          {isUploading && (
            <SlideUp
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 right-8 w-80 bg-popover border border-border shadow-xl rounded-2xl p-4 z-50"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-foreground">正在上传文件...</span>
                <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </SlideUp>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <StaggerContainer delay={0.2} className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <SlideUp
                  key={item.id}
                  layout
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="glass p-6 rounded-xl border border-border hover:border-primary/20 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${getColorClass(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-foreground">{item.title}</h3>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <span>{new Date(item.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <div className="[&_p]:mb-0 [&_p]:inline">
                          {item.summary ? (
                            <MarkdownRenderer content={item.summary.length > 15 ? item.summary.slice(0, 15) + '...' : item.summary} />
                          ) : '无描述'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div
                      className={`h-3 w-3 rounded-full ${item.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                        }`}
                      title={item.status === 'ready' ? '就绪' : '处理中'}
                    />
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                      title="删除"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </SlideUp>
              ))}
            </AnimatePresence>
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
