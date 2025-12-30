
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Industry, Policy, HistoryCategory } from '../types';
import { 
  Search, FileText, Zap, X, ArrowRight, 
  Sparkles, Activity, Layers, ShieldAlert,
  Clock, ChevronRight
} from 'lucide-react';

// 获取今日日期字符串 YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

const MOCK_POLICIES: Policy[] = [
  { 
    id: '1', 
    title: '2025 AI 伦理与治理指南', 
    summary: '针对企业级 AI 部署的合规性框架，重点关注算法备案与数据确权。', 
    fullContent: '## 政策核心摘要\n\n该指南由科技部联合多个部门发布...',
    source: '科技部', date: getTodayStr(), industry: Industry.TECHNOLOGY 
  },
  { 
    id: '2', 
    title: '绿色制造税收抵免细则', 
    summary: '覆盖光伏、储能核心企业的可再生能源转型税后优惠方案。', 
    fullContent: '## 政策核心内容\n\n国家税务总局最新发布的细则...',
    source: '能源局', date: '2024-03-15', industry: Industry.ENERGY 
  },
  { 
    id: '3', 
    title: '金融数字基建安全标准', 
    summary: '强制性核心交易系统国产化适配要求，提升金融数据主权安全性。', 
    fullContent: '## 标准演进背景\n\n金融行业核心系统国产化进入深水区...',
    source: '央行', date: '2024-03-10', industry: Industry.FINANCE 
  },
  { 
    id: '4', 
    title: '数据跨境流动新规', 
    summary: '放宽部分数据出境限制，明确重要数据识别标准，利好跨国业务开展。', 
    fullContent: '## 核心变化\n\n网信办发布...',
    source: '网信办', date: '2024-03-05', industry: Industry.TECHNOLOGY 
  }
];

const FOCUS_AREAS = ["基础信息", "关键人物", "商机捕捉", "风险预警", "销售建议"];

// 判断日期是否为今天
const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const Dashboard: React.FC = () => {
  const { user, followedCompanies, unfollowCompany } = useAppContext();
  const navigate = useNavigate();
  
  const [agentInput, setAgentInput] = useState('');
  const [focusSelection, setFocusSelection] = useState<string[]>(FOCUS_AREAS);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [agentInput]);

  const handleAgentSubmit = () => {
    if (!agentInput.trim()) return;
    const params = new URLSearchParams();
    params.set('company', agentInput);
    params.set('category', HistoryCategory.MONITORING);
    if (focusSelection.length > 0) params.set('focus', JSON.stringify(focusSelection));
    navigate(`/agent/execution?${params.toString()}`);
  };

  const handlePolicyClick = (policy: Policy) => {
    const params = new URLSearchParams();
    params.set('query', policy.title);
    params.set('category', HistoryCategory.POLICY);
    params.set('context', policy.summary);
    navigate(`/agent/execution?${params.toString()}`);
  };

  const toggleArea = (area: string) => {
    setFocusSelection(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const selectOnlyArea = (area: string) => {
    setFocusSelection([area]);
  };

  const filteredPolicies = MOCK_POLICIES.filter(p => user.industry.includes(p.industry));

  return (
    <div className="h-full grid grid-cols-12 gap-6 min-h-0">
      
      {/* 左侧主要操作与信息区 (Span 8) */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
        
        {/* 左上：指挥中心 Hero (固定高度区域) */}
        <section className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border border-blue-500/20 group">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-[80%] h-full bg-white/5 blur-[80px] pointer-events-none skew-x-12 group-hover:bg-white/10 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-inner">
                     <Sparkles size={20} className="text-white" />
                   </div>
                   <div>
                     <h1 className="text-2xl font-black text-white tracking-tight leading-none">企业智能研判</h1>
                     <p className="text-[10px] text-blue-200/80 font-bold uppercase tracking-[0.2em] mt-1.5">Enterprise Agent Core</p>
                   </div>
                </div>
             </div>

             <div className="bg-white/10 p-2 rounded-[1.5rem] border border-white/10 backdrop-blur-sm shadow-xl transition-all focus-within:bg-white/20 focus-within:border-white/30">
                <div className="flex gap-3 p-1 items-end">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-4">
                       <Search size={20} className="text-blue-200" />
                    </div>
                    <textarea 
                      ref={textareaRef}
                      rows={1}
                      placeholder="输入企业全称、政策标题或研判指令..." 
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-transparent text-white placeholder-blue-200/50 outline-none font-bold text-lg resize-none min-h-[52px] max-h-[120px] flex items-center"
                      value={agentInput} 
                      onChange={(e) => setAgentInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAgentSubmit();
                        }
                      }} 
                    />
                  </div>
                  <button 
                    onClick={handleAgentSubmit} 
                    className="bg-white text-blue-700 font-black px-6 h-[52px] rounded-xl shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2 shrink-0"
                  >
                    <Zap size={18} fill="currentColor" />
                    <span className="text-sm">执行</span>
                  </button>
                </div>

                <div className="px-4 pb-2 pt-2 border-t border-white/10 flex items-center gap-3 overflow-x-auto no-scrollbar">
                   <div className="flex items-center gap-1.5 shrink-0">
                      <Layers size={12} className="text-blue-200" />
                      <span className="text-[9px] font-black text-blue-100/60 uppercase tracking-widest">维度</span>
                   </div>
                   <div className="flex gap-2">
                      {FOCUS_AREAS.map(area => (
                        <button 
                          key={area} 
                          onClick={() => toggleArea(area)}
                          onDoubleClick={() => selectOnlyArea(area)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border whitespace-nowrap select-none ${
                            focusSelection.includes(area) 
                              ? 'bg-white text-blue-700 border-white shadow-sm' 
                              : 'bg-white/5 text-blue-100 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* 左下：情报流 (容器化设计 - 填充剩余高度) */}
        <div className="flex-1 min-h-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm z-10">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">实时情报流</h3>
             </div>
             <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 text-[10px] font-bold text-slate-400">
               {new Date().toLocaleDateString()}
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
            {filteredPolicies.map((policy, idx) => (
              <div 
                key={policy.id} 
                onClick={() => handlePolicyClick(policy)}
                className="group p-5 rounded-2xl border border-slate-200 hover:border-blue-200 bg-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer flex gap-5 items-start relative overflow-hidden"
              >
                {/* 实时情报 NEW 标记 */}
                {isToday(policy.date) && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl shadow-sm z-20 animate-pulse">
                    NEW
                  </div>
                )}

                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shadow-sm shrink-0">
                  <FileText size={20} />
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                   <div className="flex justify-between items-start">
                      <h4 className="text-base font-black text-slate-800 leading-tight group-hover:text-blue-700 transition-colors mb-2 pr-8">{policy.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{policy.source}</span>
                   </div>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-3">{policy.summary}</p>
                   
                   <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {policy.date}</span>
                      <span className="flex items-center gap-1 text-blue-600/0 group-hover:text-blue-600 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                        深度解读 <ArrowRight size={10} />
                      </span>
                   </div>
                </div>
              </div>
            ))}
            <div className="h-4"></div>
          </div>
        </div>
      </div>

      {/* 右侧：全高度监控中心 (Span 4) - 视觉轻量化重构 */}
      <div className="col-span-12 lg:col-span-4 h-full min-h-0">
        <div className="h-full bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
          {/* 标题区 */}
          <div className="p-6 pb-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
             <div>
               <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 tracking-wide">
                 <Activity size={16} className="text-indigo-600" /> 
                 企业雷达
               </h3>
               <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Monitoring {followedCompanies.length} Active Targets</p>
             </div>
             <button className="text-slate-400 hover:text-indigo-600 transition-colors">
               <ShieldAlert size={18} />
             </button>
          </div>

          {/* 列表区 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {followedCompanies.map((company) => (
              <div 
                key={company.id} 
                onClick={() => navigate(`/agent/execution?company=${company.name}&category=${HistoryCategory.MONITORING}`)}
                className="bg-slate-200 p-5 rounded-[1.5rem] border border-slate-300 hover:bg-white hover:border-indigo-200 hover:shadow-lg group transition-all cursor-pointer relative overflow-hidden"
              >
                 {/* 企业雷达 NEW 标记 */}
                 {isToday(company.dateAdded) && (
                   <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-lg shadow-sm z-20">
                     NEW
                   </div>
                 )}

                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                         {company.name.charAt(0)}
                       </div>
                       <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-800 truncate max-w-[120px]">{company.name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                             <span className="text-[9px] text-slate-500 font-bold uppercase">{company.industry}</span>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); unfollowCompany(company.id); }}
                      className="text-slate-400 hover:text-red-500 p-1 mr-4"
                    >
                      <X size={14} />
                    </button>
                 </div>

                 <div className="bg-white rounded-xl p-3 mb-3 border border-white shadow-sm">
                    <p className="text-[10px] text-slate-500 italic line-clamp-2 leading-relaxed">
                      "{company.latestOpportunitySummary}"
                    </p>
                 </div>

                 <div className="flex items-center justify-between border-t border-slate-300 pt-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {isToday(company.dateAdded) ? 'Last Update: Today' : 'Last Update: Recently'}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <ChevronRight size={14} />
                    </div>
                 </div>
              </div>
            ))}

            {followedCompanies.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                 <ShieldAlert size={48} className="text-slate-300 mb-4" />
                 <p className="text-xs text-slate-400 font-bold">暂无监控目标</p>
              </div>
            )}
          </div>
          
          {/* 底部装饰 */}
          <div className="h-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-blue-500/20 opacity-50 shrink-0"></div>
        </div>
      </div>

    </div>
  );
};
