
import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, Hexagon, Bell, Globe, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <NavLink 
      to={to} 
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
        isActive 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={18} className={isActive ? 'text-white' : 'group-hover:text-blue-400'} />
        <span className="text-[13px] font-bold tracking-wide">{label}</span>
      </div>
      {isActive && <ChevronRight size={14} className="opacity-50" />}
    </NavLink>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-900 font-sans">
      <aside className="w-64 bg-slate-950 text-white flex flex-col flex-shrink-0 z-40 border-r border-slate-800">
        <div className="p-8 flex items-center space-x-4 border-b border-slate-900 shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-[1rem] shadow-lg">
            <Hexagon className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">AI<span className="text-blue-500">.</span>AGENTS</h1>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-1.5 tracking-[0.2em]">Enterprise V2.5</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem to="/" icon={LayoutDashboard} label="首页仪表盘" />
          <SidebarItem to="/history" icon={History} label="对话历史" />
        </nav>

        <div className="p-6 shrink-0">
          <div 
            onClick={() => navigate('/profile')}
            className="group flex items-center space-x-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-slate-900 hover:shadow-lg hover:shadow-blue-900/20"
          >
            <div className="relative">
              <img src={user.avatar} alt="User" className="w-10 h-10 rounded-xl border border-slate-700 object-cover" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-slate-200 group-hover:text-white transition-colors">{user.name}</p>
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest truncate">{user.role}</p>
            </div>
            <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-30">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">智能引擎已就绪</h2>
             </div>
             <div className="hidden xl:flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                <Globe size={12} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">网络延迟: 24ms</span>
             </div>
          </div>

          <div className="flex items-center space-x-6">
             <button onClick={() => setShowNotifications(true)} className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="h-4 w-px bg-slate-200"></div>
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
               {new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })}
             </span>
          </div>
        </header>
        
        <div className="flex-1 p-6 bg-[#f8fafc] overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};
