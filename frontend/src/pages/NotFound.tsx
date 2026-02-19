import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
 
export function NotFound() {
  const navigate = useNavigate();
 
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-accent/10" />
      <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-gradient-to-tl from-primary/10 to-transparent blur-3xl" />
 
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div className={cn("glass rounded-3xl max-w-3xl w-full border border-border shadow-xl")}>
          <div className="px-10 pt-10">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-60">
                <div className="text-[10rem] leading-none font-black tracking-tighter bg-gradient-to-r from-primary to-ring bg-clip-text text-transparent select-none">
                  404
                </div>
              </div>
              <div className="text-[8rem] leading-none font-black tracking-tighter bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
                404
              </div>
            </div>
            <div className="mt-6">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground">
                您来到了知识的边界
              </h1>
              <p className="mt-3 text-muted-foreground text-base md:text-lg">
                这个页面暂时不存在。也许换个路径，或者回到工作台继续创作。
              </p>
            </div>
          </div>
 
          <div className="px-10 pb-10 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                返回上一页
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Home className="h-5 w-5" />
                回到工作台
              </button>
            </div>
            <div className="mt-6 flex items-center justify-center text-xs text-muted-foreground">
              <Compass className="h-3.5 w-3.5 mr-1" />
              EduMind · 探索、创作、重返航线
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
