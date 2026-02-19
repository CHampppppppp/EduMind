import { Home, MessageSquare, Database, Brain, LogOut, Layers, Sun, Moon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { SlideUp } from '@/components/ui/motion';

interface SidebarProps {
  logout: () => void;
}

const navItems = [
  { icon: Home, label: '工作台', path: '/' },
  { icon: Database, label: '知识库', path: '/knowledgeBase' },
  { icon: MessageSquare, label: '对话交互', path: '/interface' },
  { icon: Brain, label: '意图理解', path: '/brain' },
  { icon: Layers, label: '课件工厂', path: '/factory' },
];


export function Sidebar({ logout }: SidebarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-20 flex flex-col items-center py-8 glass border-r border-border transition-all duration-300 hover:w-48 group overflow-hidden">
      <nav className="flex-1 w-full px-2">
        <div className="space-y-4">
          {navItems.map((item, index) => (
            <SlideUp
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="w-full"
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group/item relative overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-6 w-6 min-w-[24px]" />
                <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            </SlideUp>
          ))}
        </div>
      </nav>

      <div className="mt-auto w-full px-2 space-y-2">
        <SlideUp delay={0.5} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <AnimatedThemeToggler
            className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6 min-w-[24px]" /> : <Moon className="h-6 w-6 min-w-[24px]" />}
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {theme === 'dark' ? '切换亮色' : '切换暗色'}
            </span>
          </AnimatedThemeToggler>
        </SlideUp>

        <SlideUp delay={0.6} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
          <button onClick={logout} className="flex items-center w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200">
            <LogOut className="h-6 w-6 min-w-[24px]" />
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              退出登录
            </span>
          </button>
        </SlideUp>
      </div>
    </aside>
  );
}
