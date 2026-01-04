
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { HistoryCategory } from '../types';
import { 
  Search, Zap, X, Activity, Layers, ShieldAlert,
  ChevronRight, Target, Building2, Bell, Clock, AlertTriangle
} from 'lucide-react';

const FOCUS_AREAS = ["基础信息", "关键人物", "商机捕捉", "风险预警", "销售建议"];

export const Dashboard: React.FC = () => {
  const { user, followedCompanies, unfollowCompany, markAsRead } = useAppContext();
  const navigate = useNavigate();
  
  const [agentInput, setAgentInput] = useState('');
  const [focusSelection, setFocusSelection] = useState<string[]>(FOCUS_AREAS);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [agentInput]);

  const handleAgentSubmit = () => {
    if (!agentInput.trim()) return;
    const params = new URLSearchParams();
    params.set('query', agentInput);
    params.set('company', agentInput);
    params.set('category', HistoryCategory.MONITORING);
    if (focusSelection.length > 0) params.set('focus', JSON.stringify(focusSelection));
    navigate(`/agent/execution?${params.toString()}`);
  };

  const handleCompanyClick = (companyId: string, companyName: string) => {
    markAsRead(companyId);
    navigate(`/agent/execution?company=${companyName}&category=${HistoryCategory.MONITORING}`);
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      unfollowCompany(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8 min-h-0 max-w-7xl mx-auto w-full relative">
      {/* 二次确认弹窗 Overlay */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">停止追踪该企业？</h3>
            <p className="text-sm text-slate-500 text-center font-medium leading-relaxed mb-8">
              停止追踪后，您将不再收到该企业的实时商机情报更新。此操作不可撤销。
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
              >
                取消
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-3.5 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
              >
                确认停止
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 顶部状态 */}
      <section className="shrink-0 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             早安, {user.name} <span className="text-blue-600">👋</span>
           </h1>
           <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">
             企业智能体引擎已就绪，请输入研判目标。
           </p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-4 py-2 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                <Target size={16} />
              </div>
              <div className="text-sm font-black text-slate-900">{followedCompanies.length} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">追踪中</span></div>
           </div>
        </div>
      </section>

      {/* 核心输入区 */}
      <section className="shrink-0">
          <div className="bg-white rounded-[2rem] p-1 shadow-2xl shadow-blue-600/10 border-2 border-blue-100 relative group focus-within:ring-8 focus-within:ring-blue-600/5 transition-all">
             <div className="relative">
                <div className="absolute left-7 top-7 text-blue-600">
                  <Building2 size={28} className="opacity-80" />
                </div>
                <textarea 
                  ref={textareaRef}
                  rows={1}
                  placeholder="输入目标企业全称，启动深度研判..." 
                  className="w-full pl-20 pr-40 py-8 rounded-[1.75rem] bg-transparent text-slate-900 placeholder-slate-400 outline-none font-bold text-xl resize-none min-h-[90px] max-h-[200px] leading-relaxed"
                  value={agentInput} 
                  onChange={(e) => setAgentInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAgentSubmit();
                    }
                  }} 
                />
                <div className="absolute right-3 top-3 bottom-3">
                   <button 
                     onClick={handleAgentSubmit} 
                     className="h-full bg-blue-600 text-white font-black px-10 rounded-2xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-blue-600/30"
                   >
                     <Zap size={22} fill="currentColor" />
                     <span className="text-lg">启动研判</span>
                   </button>
                </div>
             </div>

             <div className="px-7 pb-5 flex items-center gap-5 overflow-x-auto no-scrollbar border-t border-slate-50 pt-4 mt-2">
                <div className="flex items-center gap-2 shrink-0 text-slate-400">
                   <Layers size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">研判维度预设</span>
                </div>
                <div className="w-px h-5 bg-slate-200 shrink-0"></div>
                <div className="flex gap-2">
                   {FOCUS_AREAS.map(area => (
                     <button 
                       key={area} 
                       onClick={() => setFocusSelection(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                       className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border whitespace-nowrap select-none ${
                         focusSelection.includes(area) 
                           ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                           : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-white'
                       }`}
                     >
                       {area}
                     </button>
                   ))}
                </div>
             </div>
          </div>
      </section>

      {/* 情报雷达 - 企业卡片展示 */}
      <section className="flex-1 min-h-0 flex flex-col gap-5">
          <div className="flex items-center justify-between px-1 shrink-0">
             <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 tracking-[0.2em] uppercase">
               <Activity size={16} className="text-blue-600" /> 
               情报雷达 Watchlist
             </h3>
             <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
               Real-time Monitoring Active
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-10 scroll-smooth">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {followedCompanies.map((company) => {
                const unreadCount = company.recentUpdates.filter(u => !u.isRead).length;
                return (
                  <div 
                    key={company.id} 
                    className="bg-white p-0 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 group transition-all relative overflow-hidden flex flex-col h-[360px]"
                  >
                     <div className="p-7 flex flex-col h-full relative z-10">
                        {/* 头部：基本信息 */}
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
                             onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(company.id); }}
                             className="text-slate-300 hover:text-red-600 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                           >
                             <X size={18} />
                           </button>
                        </div>

                        {/* 内容：动态更新列表 */}
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

                        {/* 底部：操作与更多动态 */}
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

              {/* 添加新目标占位 */}
              <div 
                onClick={() => document.querySelector('textarea')?.focus()}
                className="bg-blue-50/20 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6 h-[360px] hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer group"
              >
                 <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-300 group-hover:scale-110 group-hover:text-blue-600 group-hover:border-blue-300 transition-all mb-4">
                    <Search size={24} />
                 </div>
                 <p className="text-xs font-black text-blue-400 group-hover:text-blue-600 uppercase tracking-widest">添加新研判目标</p>
              </div>
            </div>
          </div>
      </section>
    </div>
  );
};
