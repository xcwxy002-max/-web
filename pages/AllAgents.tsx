
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Grid, Pin, PinOff, Building2, Gavel, Newspaper, Briefcase, ExternalLink, MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';

const IconComponent = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
  switch (name) {
    case 'Gavel': return <Gavel size={size} className={className} />;
    case 'Newspaper': return <Newspaper size={size} className={className} />;
    case 'Building2': return <Building2 size={size} className={className} />;
    default: return <Briefcase size={size} className={className} />;
  }
};

export const AllAgents: React.FC = () => {
  const { agents, toggleAgentPin } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="shrink-0 mb-8 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Grid className="text-blue-600" /> 全部应用 (Agents)
           </h1>
           <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em] ml-1">
             AI AGENT MARKETPLACE & MANAGEMENT
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-blue-400/50 transition-all group flex flex-col h-full">
             <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    agent.color === 'blue' ? 'bg-blue-600 shadow-blue-200' : 
                    agent.color === 'indigo' ? 'bg-indigo-500 shadow-indigo-200' : 
                    'bg-emerald-500 shadow-emerald-200'
                }`}>
                   <IconComponent name={agent.icon} size={28} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => toggleAgentPin(agent.id)}
                    className={`p-2 rounded-xl transition-all ${
                      agent.pinned 
                        ? 'bg-blue-50 text-blue-600 hover:bg-slate-100 hover:text-slate-400' 
                        : 'bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={agent.pinned ? "取消侧边栏固定" : "固定到侧边栏"}
                  >
                    {agent.pinned ? <Pin size={18} fill="currentColor" /> : <Pin size={18} />}
                  </button>
                </div>
             </div>

             <div className="mb-6 flex-1">
                <h3 className="text-lg font-black text-slate-900 mb-1">{agent.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{agent.description}</p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 uppercase rounded tracking-wider">
                    {agent.category}
                  </span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => navigate(`/agent/execution?agentId=${agent.id}&category=${agent.category}`)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                >
                  <MessageSquare size={14} /> 开始对话
                </button>
                <button 
                  onClick={() => navigate(`/history?agentId=${agent.id}&category=${agent.category}`)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <Briefcase size={14} /> 历史记录
                </button>
             </div>
          </div>
        ))}
        
        {/* Placeholder for coming soon */}
        <div className="bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity">
           <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <Building2 size={20} />
           </div>
           <p className="text-sm font-black text-slate-500">更多 Agent 开发中...</p>
        </div>
      </div>
    </div>
  );
};
