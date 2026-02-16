import { Sidebar } from './Sidebar';
import { useUser } from '@/context/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useUser();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pl-20 transition-all duration-300">
        <header className="flex justify-end items-center px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           {user ? (
             <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{user.username}</span>
                </div>
                {user.avatar_url ? (
                    <img 
                        src={user.avatar_url} 
                        alt={user.username} 
                        className="h-9 w-9 rounded-full border border-border"
                    />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-border text-primary font-medium">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                )}
                <button 
                    onClick={logout} 
                    className="ml-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    退出
                </button>
             </div>
           ) : (
             <div className="text-sm text-muted-foreground">未登录</div>
           )}
        </header>
        <div className="flex-1 overflow-auto">
           {children}
        </div>
      </main>
    </div>
  );
}
