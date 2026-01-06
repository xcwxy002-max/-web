
import React, { useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, History, Hexagon, Bell, Globe, ChevronRight, 
  ChevronDown, Grid, Building2, Gavel, Newspaper, Briefcase, MessageSquare,
  Settings, X, GripVertical, PinOff
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AgentApp } from '../types';

// Helper to render dynamic icons
const IconComponent = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
  switch (name) {
    case 'Gavel': return <Gavel size={size} className={className} />;
    case 'Newspaper': return <Newspaper size={size} className={className} />;
    case 'Building2': return <Building2 size={size} className={className} />;
    default: return <Briefcase size={size} className={className} />;
  }
};

const SubMenuItem = ({ to, label, isActive }: { to: string, label: string, isActive: boolean }) => (
  <NavLink 
    to={to}
    className={`flex items-center gap-2 pl-11 pr-4 py-2 rounded-lg transition-all text-[11px] font-bold ${
      isActive ? 'text-blue-400 bg-white/5' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-blue-400' : 'bg-slate-600'}`}></div>
    {label}
  </NavLink>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, agents, toggleAgentPin, reorderAgents } = useAppContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // 仅显示固定的 Agent
  const pinnedAgents = agents.filter(a => a.pinned);

  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleAgentClick = (agent: AgentApp) => {
    if (expandedAgentId === agent.id) {
      setExpandedAgentId(null);
    } else {
      setExpandedAgentId(agent.id);
      navigate(`/agent/execution?agentId=${agent.id}&category=${agent.category}`);
    }
  };

  const isAgentActive = (agentId: string) => {
    const params = new URLSearchParams(location.search);
    return params.get('agentId') === agentId;
  };

  // Drag Sorting Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    // 添加一点视觉反馈
    e.currentTarget.classList.add('opacity-50', 'bg-blue-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'bg-blue-50');
    
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newPinnedList = [...pinnedAgents];
      const draggedItemContent = newPinnedList[dragItem.current];
      newPinnedList.splice(dragItem.current, 1);
      newPinnedList.splice(dragOverItem.current, 0, draggedItemContent);
      
      // 提取排序后的 ID 列表并更新 Context
      reorderAgents(newPinnedList.map(a => a.id));
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-900 font-sans relative">
      
      {/* Sidebar Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900">侧边栏导航配置</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">拖拽调整顺序，移除后需在“全部应用”重新添加</p>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-2 bg-slate-50/50 flex-1">
              {pinnedAgents.length > 0 ? (
                pinnedAgents.map((agent, index) => (
                  <div 
                    key={agent.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-300 transition-all cursor-move group select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-300 group-hover:text-blue-400 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shadow-sm ${
                          agent.color === 'blue' ? 'bg-blue-600' : 
                          agent.color === 'indigo' ? 'bg-indigo-500' : 
                          'bg-emerald-500'
                      }`}>
                         <IconComponent name={agent.icon} size={14} />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{agent.name}</span>
                    </div>

                    <button 
                      onClick={() => toggleAgentPin(agent.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="取消显示（移除）"
                    >
                      <PinOff size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-xs text-slate-400 font-medium">暂无固定应用，请前往“全部应用”添加。</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 text-center">
               <button onClick={() => setIsConfigOpen(false)} className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-blue-600 transition-colors">
                 完成设置
               </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-950 text-white flex flex-col flex-shrink-0 z-40 border-r border-slate-800">
        <div className="p-8 flex items-center space-x-4 border-b border-slate-900 shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-[1rem] shadow-lg">
            <Hexagon className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">AI<span className="text-blue-500">.</span>AGENTS</h1>
            <p className="text-[9px] text-slate-500 font-black uppercase mt-1.5 tracking-[0.2em]">Enterprise V3.0</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 mb-2 mt-2">Platform</div>
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
              isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <LayoutDashboard size={18} />
              <span className="text-[13px] font-bold tracking-wide">首页仪表盘</span>
            </div>
          </NavLink>

          <div className="flex items-center justify-between px-4 mt-6 mb-2">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">My Agents</div>
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="text-slate-600 hover:text-white transition-colors p-1 rounded hover:bg-slate-800" 
              title="配置导航顺序"
            >
              <Settings size={12} />
            </button>
          </div>
          
          {pinnedAgents.map(agent => {
             const isExpanded = expandedAgentId === agent.id;
             const isActive = isAgentActive(agent.id);
             
             return (
               <div key={agent.id} className="flex flex-col">
                 <button 
                   onClick={() => handleAgentClick(agent)}
                   className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                     isActive || isExpanded
                       ? 'text-white bg-slate-800/50' 
                       : 'text-slate-400 hover:text-white hover:bg-slate-800'
                   }`}
                 >
                   <div className="flex items-center space-x-3">
                     <IconComponent name={agent.icon} size={18} className={isActive ? 'text-blue-400' : 'group-hover:text-blue-400'} />
                     <span className="text-[13px] font-bold tracking-wide">{agent.name}</span>
                   </div>
                   <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : 'text-slate-600'}`} />
                 </button>
                 
                 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                    <SubMenuItem 
                      to={`/agent/execution?agentId=${agent.id}&category=${agent.category}`} 
                      label="开始对话" 
                      isActive={location.pathname === '/agent/execution' && new URLSearchParams(location.search).get('agentId') === agent.id}
                    />
                    <SubMenuItem 
                      to={`/history?agentId=${agent.id}&category=${agent.category}`} 
                      label="历史记录" 
                      isActive={location.pathname === '/history' && new URLSearchParams(location.search).get('agentId') === agent.id}
                    />
                 </div>
               </div>
             );
          })}

          <NavLink 
            to="/apps" 
            className={({ isActive }) => `flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2 ${
              isActive 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-500 hover:text-white hover:bg-slate-800 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Grid size={18} />
              <span className="text-[12px] font-bold tracking-wide">全部应用</span>
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </NavLink>

        </nav>

        <div className="p-6 shrink-0 border-t border-slate-900">
          <div 
            onClick={() => navigate('/profile')}
            className="group flex items-center space-x-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-slate-900 hover:shadow-lg hover:shadow-blue-900/20"
          >
            <div className="relative">
              <img src={user.avatar} alt="User" className="w-10 h-10 rounded-xl border border-slate-700 object-cover" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-950 rounded-md flex items-center justify-center border border-slate-700">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-slate-200 group-hover:text-white transition-colors">{user.name}</p>
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-30">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                  {location.pathname === '/' ? 'Home Dashboard' : location.pathname.split('/')[1].toUpperCase()}
                </h2>
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
