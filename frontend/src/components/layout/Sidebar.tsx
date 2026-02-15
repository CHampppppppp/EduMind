import { Home, MessageSquare, Database, Brain, Settings, Layers } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: '工作台', path: '/' },
  { icon: Database, label: '知识库', path: '/knowledge' },
  { icon: MessageSquare, label: '对话交互', path: '/chat' },
  { icon: Brain, label: '意图理解', path: '/analysis' },
  { icon: Layers, label: '课件工厂', path: '/generate' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 flex flex-col items-center py-8 glass border-r border-white/10 transition-all duration-300 hover:w-48 group overflow-hidden">
      <div className="mb-8 flex items-center justify-start w-full px-4">
        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl flex-shrink-0">{/*防止logo坍塌*/}
          E{/*  logo here */}
        </div>
        <span className="ml-4 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          EduMind
        </span>
      </div>

      <nav className="flex-1 w-full px-2 space-y-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group/item relative overflow-hidden",
                isActive
                  ? "bg-black text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              )
            }
          >
            <item.icon className="h-6 w-6 min-w-[24px]" />
            <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto w-full px-2">
        <button className="flex items-center w-full px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-black transition-all duration-200">
          <Settings className="h-6 w-6 min-w-[24px]" />
          <span className="ml-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            设置
          </span>
        </button>
      </div>
    </aside>
  );
}
