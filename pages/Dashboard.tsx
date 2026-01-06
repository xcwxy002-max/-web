
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Search, Zap, X, Activity, Layers, ShieldAlert,
  ChevronRight, Target, Building2, Bell, Clock, TrendingUp, Settings2, Plus, GripVertical, CheckCircle,
  ArrowUp, ArrowDown, AlertTriangle
} from 'lucide-react';

import { Gavel, Newspaper } from 'lucide-react'; 

const FOCUS_AREAS = ["基础信息", "关键人物", "商机捕捉", "风险预警", "销售建议"];

// Component for rendering icons dynamically
const IconComponent = ({ name, size = 18, className = "" }: { name: string, size?: number, className?: string }) => {
  if (name === 'Building2') return <Building2 size={size} className={className} />;
  if (name === 'Newspaper') return <Newspaper size={size} className={className} />;
  if (name === 'Gavel') return <Gavel size={size} className={className} />;
  return <Building2 size={size} className={className} />;
};

export const Dashboard: React.FC = () => {
  const { user, followedCompanies, unfollowCompany, markAsRead, agents, dashboardWidgets, toggleWidgetVisibility, reorderWidgets } = useAppContext();
  const navigate = useNavigate();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<{id: string, name: string} | null>(null);

  const handleCompanyClick = (companyId: string, companyName: string) => {
    markAsRead(companyId);
    // 假设第一个 Agent 是企业分析
    const agent = agents.find(a => a.id === 'enterprise-analyst');
    if (agent) {
        navigate(`/agent/execution?agentId=${agent.id}&category=${agent.category}&company=${companyName}`);
    }
  };

  const confirmUnfollow = () => {
    if (companyToRemove) {
      unfollowCompany(companyToRemove.id);
      setCompanyToRemove(null);
    }
  };

  const visibleWidgets = dashboardWidgets.filter(w => w.visible).sort((a, b) => a.order - b.order);
  const allWidgetsSorted = [...dashboardWidgets].sort((a, b) => a.order - b.order);

  // Widget Renders
  const renderMonitoringWidget = () => (
    <div className="flex flex-col gap-5 h-full min-h-0">
       <div className="flex items-center justify-between px-1 shrink-0">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 tracking-[0.2em] uppercase">
            <Activity size={16} className="text-blue-600" /> 
            情报雷达 Watchlist
          </h3>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Real-time Monitoring Active
          </div>
       </div>

       <div className="flex-1 overflow-y-auto pr-2 pb-2 scroll-smooth min-h-[300px]">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {followedCompanies.map((company) => {
             const unreadCount = company.recentUpdates.filter(u => !u.isRead).length;
             return (
               <div 
                 key={company.id} 
                 className="bg-white p-0 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 group transition-all relative overflow-hidden flex flex-col h-[340px]"
               >
                  <div className="p-7 flex flex-col h-full relative z-10">
                     <div className="flex justify-between items-start mb-6 shrink-0">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleCompanyClick(company.id, company.name)}>
                           <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
                             {company.name.charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                 <h4 className="text-[16px] font-black text-slate-900 truncate max-w-[140px] group-hover:text-blue-700 transition-colors">{company.name}</h4>
                                 {unreadCount > 0 && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                                 )}
                              </div>
                              <p className="text-[10px] text-blue-500 font-bold uppercase mt-0.5 tracking-wider">{company.industry}</p>
                           </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCompanyToRemove({ id: company.id, name: company.name }); }}
                          className="text-slate-300 hover:text-red-600 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                        >
                          <X size={18} />
                        </button>
                     </div>

                     <div className="flex-1 min-h-0 relative mb-4">
                        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                        <div className="h-full overflow-y-auto no-scrollbar space-y-3 pb-6">
                           {company.recentUpdates.map((update) => (
                             <div 
                               key={update.id} 
                               className={`relative p-3 rounded-2xl border transition-all ${
                                 !update.isRead 
                                   ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                   : 'bg-slate-50 border-slate-100'
                               }`}
                             >
                               <div className="flex justify-between items-start mb-1 gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                     {!update.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>}
                                     <span className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded ${!update.isRead ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                       {update.type}
                                     </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-400 shrink-0">
                                     <Clock size={10} />
                                     <span className="text-[8px] font-bold">{update.date}</span>
                                  </div>
                               </div>
                               <p className={`text-[11px] leading-relaxed line-clamp-2 ${!update.isRead ? 'text-blue-900 font-bold' : 'text-slate-600 font-medium'}`}>
                                 {update.text}
                               </p>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto shrink-0">
                        <div className="flex items-center gap-2">
                           {unreadCount > 0 ? (
                             <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600">
                               <Bell size={12} className="animate-bounce" /> {unreadCount} 条新动态
                             </span>
                           ) : (
                             <span className="text-[10px] font-black text-slate-400">
                               情报已同步
                             </span>
                           )}
                        </div>
                        
                        <button 
                          onClick={() => handleCompanyClick(company.id, company.name)}
                          className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all ${
                            unreadCount > 0 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          更多动态 <ChevronRight size={12} />
                        </button>
                     </div>
                  </div>
               </div>
             );
           })}

           <div 
             onClick={() => navigate('/apps')}
             className="bg-blue-50/20 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6 h-[340px] hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer group"
           >
              <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-300 group-hover:scale-110 group-hover:text-blue-600 group-hover:border-blue-300 transition-all mb-4">
                 <Plus size={24} />
              </div>
              <p className="text-xs font-black text-blue-400 group-hover:text-blue-600 uppercase tracking-widest">添加关注企业 / 管理组件</p>
           </div>
         </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-8 min-h-0 max-w-7xl mx-auto w-full relative">
      {/* Configure Modal */}
      {isEditMode && (
         <div className="absolute top-16 right-0 z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase">配置首页组件</h4>
                <button onClick={() => setIsEditMode(false)}><X size={14} className="text-slate-400 hover:text-slate-900" /></button>
             </div>
             <div className="space-y-2">
                {allWidgetsSorted.map((widget, index) => (
                   <div key={widget.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                         <GripVertical size={12} className="text-slate-300" />
                         <span className="text-xs font-bold text-slate-600">{widget.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="flex items-center bg-white rounded border border-slate-200">
                           <button 
                             onClick={() => reorderWidgets(index, index - 1)} 
                             disabled={index === 0}
                             className="p-1 hover:bg-slate-50 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                           >
                             <ArrowUp size={10} />
                           </button>
                           <div className="w-px h-3 bg-slate-100"></div>
                           <button 
                             onClick={() => reorderWidgets(index, index + 1)} 
                             disabled={index === allWidgetsSorted.length - 1}
                             className="p-1 hover:bg-slate-50 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                           >
                             <ArrowDown size={10} />
                           </button>
                         </div>
                         <button onClick={() => toggleWidgetVisibility(widget.id)} className={`w-8 h-4 rounded-full p-0.5 transition-colors ${widget.visible ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${widget.visible ? 'translate-x-4' : 'translate-x-0'}`}></div>
                         </button>
                      </div>
                   </div>
                ))}
             </div>
         </div>
      )}

      {/* Confirmation Modal */}
      {companyToRemove && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-slate-100 animate-in zoom-in-95 duration-200">
               <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                 <AlertTriangle size={24} />
               </div>
               <h3 className="text-lg font-black text-slate-900 text-center mb-2">确认不再关注？</h3>
               <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
                 您将移除对 <span className="font-bold text-slate-800">{companyToRemove.name}</span> 的所有追踪，且无法再接收其实时动态推送。
               </p>
               <div className="flex gap-3">
                 <button onClick={() => setCompanyToRemove(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
                   取消
                 </button>
                 <button onClick={confirmUnfollow} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">
                   确认移除
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* 顶部欢迎区 + 快捷入口 */}
      <section className="shrink-0 space-y-6">
         <div className="flex items-start justify-between">
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                早安, {user.name} <span className="text-blue-600">👋</span>
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">
                今日工作重心：2个 招标项目需要跟进，1个 风险预警待处理。
              </p>
           </div>
           <button 
             onClick={() => setIsEditMode(!isEditMode)} 
             className={`p-2 rounded-xl border transition-all ${isEditMode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
           >
             <Settings2 size={18} />
           </button>
         </div>

         {/* 常用 Agent 快捷入口 */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {agents.slice(0, 4).map(agent => (
               <button 
                 key={agent.id}
                 onClick={() => navigate(`/agent/execution?agentId=${agent.id}&category=${agent.category}`)}
                 className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all text-left group"
               >
                  <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white shadow-lg ${
                    agent.id === 'enterprise-analyst' ? 'bg-blue-600 shadow-blue-200' : 
                    agent.id === 'bid-expert' ? 'bg-indigo-500 shadow-indigo-200' : 
                    'bg-emerald-500 shadow-emerald-200'
                  }`}>
                     <IconComponent name={agent.icon} size={20} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{agent.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1">{agent.description}</p>
               </button>
            ))}
         </div>
      </section>

      {/* 动态 Widget 渲染区 */}
      <section className="flex-1 min-h-0 flex flex-col">
         {visibleWidgets.map(widget => {
            if (widget.type === 'monitoring') return <div key={widget.id} className="flex-1 min-h-0 flex flex-col">{renderMonitoringWidget()}</div>;
            return null;
         })}
      </section>
    </div>
  );
};
