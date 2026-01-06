
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { generateCompanyAnalysis, chatWithAgent } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import { CompanyReport, ChatMessage, DataSource, HistoryItem, HistoryCategory } from '../types';
import { 
  Building2, Send, ArrowLeft, Zap, Layers, Activity, X,
  FileText, MessageSquare, AlertTriangle
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);
const FOCUS_AREAS = ["基础信息", "关键人物", "商机捕捉", "风险预警", "销售建议"];
const FEEDBACK_REASONS = ["数据错误", "信息滞后", "逻辑漏洞", "答非所问", "格式混乱", "其他"];

interface FeedbackState {
  isOpen: boolean;
  submitted: boolean;
  reason: string | null;
  detail: string;
}

const RichText: React.FC<{ text: string; isUser?: boolean }> = ({ text, isUser = false }) => {
  if (!text) return null;

  // Simple splitting by newline to preserve line breaks
  const lines = text.split('\n');

  return (
    <div className={`text-sm leading-relaxed space-y-1 ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {lines.map((line, i) => {
        // Parse bold (**text**) and links ([text](url)) simply
        const parts = line.split(/(\*\*.*?\*\*)|(\[.*?\]\(.*?\))/g);
        
        return (
          <div key={i} className="min-h-[1.2em]">
            {parts.map((part, idx) => {
              if (!part) return null;

              if (part.startsWith('**') && part.endsWith('**')) {
                // Return plain text without bold styling as requested
                return <span key={idx}>{part.slice(2, -2)}</span>;
              } 
              
              if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                   return (
                     <a key={idx} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                       {match[1]}
                     </a>
                   );
                }
              }

              return <span key={idx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const AgentExecution: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const companyNameParam = searchParams.get('company');
  const queryParam = searchParams.get('query');
  const categoryParam = (searchParams.get('category') as HistoryCategory) || HistoryCategory.REGULAR;
  const agentIdParam = searchParams.get('agentId');
  const contextParam = searchParams.get('context');
  const focusParam = searchParams.get('focus');
  const focusAreas = focusParam ? JSON.parse(focusParam) : [];
  
  const { addToHistory, followCompany, followedCompanies, unfollowCompany, markAsRead, user } = useAppContext();
  const historyState = location.state as { historyItem: HistoryItem } | undefined;

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackState>>({});
  
  // Specific state for Enterprise Analyst landing page
  const [landingInput, setLandingInput] = useState('');
  const [landingFocus, setLandingFocus] = useState<string[]>(FOCUS_AREAS);
  const [companyToRemove, setCompanyToRemove] = useState<{id: string, name: string} | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    // If we have history state, load it
    if (historyState?.historyItem) {
      if (historyState.historyItem.reportData) {
        setReport(historyState.historyItem.reportData);
      }
      setMessages(historyState.historyItem.chatHistory || []);
      setLoading(false);
      return;
    }

    // Only auto-start if we have specific parameters
    if (companyNameParam && messages.length === 0) {
      startEnterpriseExecution(companyNameParam, focusAreas);
    } else if (queryParam && messages.length === 0) {
      startGenericExecution(queryParam, contextParam);
    }
  }, [companyNameParam, queryParam, historyState]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const updateThinkingMessage = (text: string) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === 'model' && lastMsg.text.includes('...')) {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: 'model', text: `${text}` };
        return newHistory;
      } else {
        return [...prev, { role: 'model', text: `${text}` }];
      }
    });
  };

  const toggleFeedbackForm = (index: number) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], isOpen: !prev[index]?.isOpen, submitted: prev[index]?.submitted || false, reason: prev[index]?.reason || null, detail: prev[index]?.detail || '' }
    }));
  };

  const updateFeedbackReason = (index: number, reason: string) => setFeedbacks(prev => ({ ...prev, [index]: { ...prev[index], reason } }));
  const updateFeedbackDetail = (index: number, detail: string) => setFeedbacks(prev => ({ ...prev, [index]: { ...prev[index], detail } }));
  const submitFeedback = (index: number) => setFeedbacks(prev => ({ ...prev, [index]: { ...prev[index], submitted: true, isOpen: false } }));

  const formatSources = (sources?: DataSource[]) => {
    if (!sources || sources.length === 0) return '';
    const links = sources.map(s => `[${s.title}](${s.url})`).join(' ');
    return `\n来源: ${links}`;
  };

  const handleLandingSubmit = () => {
    if (!landingInput.trim()) return;
    // Update URL params to reflect the execution, this keeps history consistent
    setSearchParams(prev => {
      prev.set('company', landingInput);
      prev.set('focus', JSON.stringify(landingFocus));
      return prev;
    });
    // Trigger execution immediately
    startEnterpriseExecution(landingInput, landingFocus);
  };

  const handleRadarClick = (companyId: string, companyName: string) => {
    markAsRead(companyId);
    setSearchParams(prev => {
      prev.set('company', companyName);
      return prev;
    });
    startEnterpriseExecution(companyName, FOCUS_AREAS); // Default to all focus areas for radar click
  };

  const confirmUnfollow = () => {
    if (companyToRemove) {
      unfollowCompany(companyToRemove.id);
      setCompanyToRemove(null);
    }
  };

  const startEnterpriseExecution = async (name: string, focus: string[]) => {
    setLoading(true);
    setMessages([{ role: 'model', text: "初始化分析引擎..." }]);
    
    const steps = ["正在接入多源数据...", "正在进行逻辑关系研判...", "正在构建策略报告框架..."];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 800));
      updateThinkingMessage(step);
    }

    try {
      const result = await generateCompanyAnalysis(name, focus, user.businessCapabilities);
      setReport(result);

      // Removed Emojis as requested for pure text style
      const opportunitiesText = result.opportunities.map(o => {
        const sourceStr = formatSources(o.sources);
        return `• [${o.type}] **${o.title}**: ${o.description}\n   [介入建议]: ${o.interventionStrategy}${sourceStr}`;
      }).join('\n\n');

      const basicInfoSource = formatSources(result.basicInfo.sources);
      const riskText = result.risks.length > 0 
        ? `\n\n潜在风险\n${result.risks.map(r => `• [${r.severity}] **[风险预警] ${r.category}**: ${r.description} ${formatSources(r.sources)}`).join('\n')}`
        : '';

      const analysisMessages: ChatMessage[] = [
        { role: 'model', text: `分析报告生成完毕\n\n**企业基础画像**\n${result.basicInfo.overview}\n\n总部：${result.basicInfo.headquarters} | 行业：${result.basicInfo.industry} | 状态：${result.basicInfo.fundingStatus}${basicInfoSource}` },
        { role: 'model', text: `核心商机情报 & 介入建议\n\n${opportunitiesText}` },
        { role: 'model', text: `推荐销售策略\n${result.salesStrategy}${riskText}` }
      ];
      
      setMessages(analysisMessages);
      addToHistory({ id: generateId(), category: HistoryCategory.MONITORING, query: name, date: new Date().toLocaleDateString(), summary: `企业分析: ${result.companyName}`, reportData: result, chatHistory: analysisMessages });
    } catch (err) { 
      setMessages([{ role: 'model', text: "任务执行失败：未能获取到该企业有效深度数据或网络超时。" }]); 
    }
    finally { setLoading(false); }
  };

  const startGenericExecution = async (q: string, context?: string | null) => {
    setLoading(true);
    setMessages([{ role: 'model', text: "正在挂载政策上下文..." }]);
    const steps = ["正在提取核心条款...", "正在生成解读视角..."];
    for (const step of steps) { await new Promise(r => setTimeout(r, 600)); updateThinkingMessage(step); }

    const initialPrompt = context ? `针对该内容：${context}\n\n请进行深度解读：` : `请研判：${q}`;
    const responseText = await chatWithAgent([], initialPrompt, "行业政策解读模式");
    const initialMsg: ChatMessage[] = [{ role: 'user', text: q }, { role: 'model', text: responseText }];
    setMessages(initialMsg);
    addToHistory({ id: generateId(), category: categoryParam, query: q, date: new Date().toLocaleDateString(), summary: `政策/常规研判: ${q.slice(0, 20)}`, chatHistory: initialMsg });
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userQuery = inputMessage;
    const newMsg: ChatMessage = { role: 'user', text: userQuery };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setChatLoading(true);
    const responseText = await chatWithAgent([...messages, newMsg], userQuery, report ? JSON.stringify(report) : "上下文对话");
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setChatLoading(false);
  };

  const scrollToMessage = (index: number) => { messageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const isFollowed = report ? followedCompanies.some(c => c.name === report.companyName) : false;

  const navPoints = messages
    .map((m, idx) => ({ role: m.role, text: m.text, index: idx }))
    .filter(m => m.role === 'model' && !m.text.includes('...'))
    .map((m, i) => {
      let label = `回复 #${i + 1}`;
      if (report && i === 0) label = "基础画像";
      if (report && i === 1) label = "商机情报";
      if (report && i === 2) label = "销售策略";
      return { label, index: m.index };
    });

  // Render Landing Page for Enterprise Analyst if no messages
  if (messages.length === 0 && !loading && agentIdParam === 'enterprise-analyst') {
     return (
       <div className="h-full flex flex-col max-w-7xl mx-auto gap-8 overflow-y-auto px-4 py-2 relative">
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
         
         {/* Input Section */}
         <div className="bg-white rounded-[2rem] p-1 shadow-2xl shadow-blue-600/10 border-2 border-blue-100 relative group focus-within:ring-8 focus-within:ring-blue-600/5 transition-all shrink-0">
             <div className="relative">
                <div className="absolute left-7 top-7 text-blue-600">
                  <Building2 size={28} className="opacity-80" />
                </div>
                <textarea 
                  rows={1}
                  placeholder="输入目标企业全称，启动深度研判..." 
                  className="w-full pl-20 pr-40 py-8 rounded-[1.75rem] bg-transparent text-slate-900 placeholder-slate-400 outline-none font-bold text-xl resize-none min-h-[90px] leading-relaxed"
                  value={landingInput} 
                  onChange={(e) => setLandingInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleLandingSubmit();
                    }
                  }} 
                />
                <div className="absolute right-3 top-3 bottom-3">
                   <button 
                     onClick={handleLandingSubmit} 
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
                       onClick={() => setLandingFocus(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                       className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border whitespace-nowrap select-none ${
                         landingFocus.includes(area) 
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

          {/* Radar Section */}
          <section className="flex-1 flex flex-col gap-5 min-h-0">
            <div className="flex items-center justify-between px-1 shrink-0">
               <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 tracking-[0.2em] uppercase">
                 <Activity size={16} className="text-blue-600" /> 
                 情报雷达 Watchlist
               </h3>
               <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                 Live Monitoring
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {followedCompanies.map((company) => {
                const unreadCount = company.recentUpdates.filter(u => !u.isRead).length;
                return (
                  <div 
                    key={company.id} 
                    className="bg-white p-0 rounded-[2.5rem] border-2 border-slate-100 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 group transition-all relative overflow-hidden flex flex-col h-[320px] cursor-pointer"
                    onClick={() => handleRadarClick(company.id, company.name)}
                  >
                     <div className="p-7 flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4 shrink-0">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
                                {company.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-[16px] font-black text-slate-900 truncate max-w-[140px] group-hover:text-blue-700 transition-colors">{company.name}</h4>
                                    {unreadCount > 0 && <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>}
                                 </div>
                                 <p className="text-[10px] text-blue-500 font-bold uppercase mt-0.5 tracking-wider">{company.industry}</p>
                              </div>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); setCompanyToRemove({ id: company.id, name: company.name }); }} className="text-slate-300 hover:text-red-600 p-1.5 opacity-0 group-hover:opacity-100 transition-all"><X size={18} /></button>
                        </div>

                        {/* Recent Updates Preview */}
                        <div className="flex-1 overflow-hidden relative">
                           <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                           <div className="space-y-2">
                              {company.recentUpdates.slice(0, 2).map((update) => (
                                <div key={update.id} className={`p-2.5 rounded-xl border ${!update.isRead ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-50'}`}>
                                  <div className="flex justify-between items-center mb-1">
                                     <span className={`text-[8px] font-black uppercase px-1 rounded ${!update.isRead ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{update.type}</span>
                                     <span className="text-[8px] text-slate-400">{update.date}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">{update.text}</p>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="pt-4 mt-auto flex items-center justify-between border-t border-slate-100">
                           <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors">
                             <MessageSquare size={12} /> 点击发起研判
                           </div>
                           <Activity size={14} className="text-slate-200 group-hover:text-blue-400" />
                        </div>
                     </div>
                  </div>
                );
              })}
              
              <div className="bg-blue-50/20 border-2 border-dashed border-blue-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6 h-[320px] opacity-60">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-300 mb-3 shadow-sm"><Building2 size={20}/></div>
                 <p className="text-xs font-black text-blue-400 uppercase tracking-widest">更多企业...</p>
              </div>
            </div>
          </section>
       </div>
     );
  }

  // Standard Chat View (for other agents or when active)
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-6xl mx-auto bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn relative">
      <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 border border-slate-100"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3">
             <div className="bg-slate-900 p-2 rounded-xl text-white shadow-sm">
               {categoryParam === HistoryCategory.POLICY ? <FileText size={18}/> : <Building2 size={18} />}
             </div>
             <div>
                <h2 className="text-sm font-black text-slate-900 leading-none">{report?.companyName || queryParam || (agentIdParam === 'enterprise-analyst' ? '企业深度研判' : '智能对话中...')}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{categoryParam} Context</p>
                </div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {report && (
             <button onClick={() => !isFollowed && followCompany({ id: generateId(), name: report.companyName, latestOpportunitySummary: report.opportunities[0]?.title || '详情', dateAdded: new Date().toLocaleDateString(), industry: report.basicInfo.industry, opportunities: report.opportunities })} className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${isFollowed ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'}`}>
               {isFollowed ? '已在追踪' : '+ 情报追踪'}
             </button>
           )}
        </div>
      </div>

      {navPoints.length > 0 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 p-2 bg-white/40 backdrop-blur-md border border-slate-200 rounded-full shadow-xl transition-all hover:bg-white animate-slideIn group">
          <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto no-scrollbar py-1">
            {navPoints.map((point, i) => (
              <button key={i} onClick={() => scrollToMessage(point.index)} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-blue-600 hover:text-white transition-all group/btn relative">
                {i + 1}
                <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl">
                  {point.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-slate-50/20 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <p className="text-slate-400 font-bold">请在下方输入您的问题</p>
             </div>
          )}
          
          {messages.map((msg, i) => {
            const isThinking = msg.text.includes('...');
            const feedback = feedbacks[i] || { isOpen: false, submitted: false, reason: null, detail: '' };

            return (
              <div key={i} ref={el => messageRefs.current[i] = el} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                <div className={`flex gap-4 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar Icon Removed */}
                  
                  <div className={`relative flex flex-col items-${msg.role === 'user' ? 'end' : 'start'}`}>
                    <div className={`p-6 rounded-[1.75rem] shadow-sm border transition-all relative group/bubble ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-lg shadow-blue-500/20' 
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none font-medium'
                    }`}>
                      
                      {/* Collapse Chevron Removed */}

                      <div className="transition-all duration-300">
                        {isThinking ? (
                           <div className="flex items-center gap-3 text-blue-600 animate-pulse">
                              <span className="font-bold text-sm">{msg.text}</span>
                           </div>
                        ) : (
                           <RichText text={msg.text} isUser={msg.role === 'user'} />
                        )}
                      </div>
                    </div>

                    {/* Feedback Form (Text only, no icons) */}
                    {msg.role === 'model' && !isThinking && (
                      <div className="mt-2 ml-2 relative">
                         {!feedback.isOpen && !feedback.submitted && (
                            <button 
                              onClick={() => toggleFeedbackForm(i)}
                              className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] font-bold"
                            >
                               反馈
                            </button>
                         )}
                         
                         {feedback.submitted && (
                            <div className="text-slate-400 px-2 py-1 text-[10px] font-bold">
                               已反馈
                            </div>
                         )}

                         {feedback.isOpen && !feedback.submitted && (
                           <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 mt-1 w-[320px] animate-fadeIn origin-top-left z-20">
                              <div className="flex items-center justify-between mb-3">
                                 <h4 className="text-xs font-black text-slate-800">
                                   内容质量反馈
                                 </h4>
                                 <button onClick={() => toggleFeedbackForm(i)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                 {FEEDBACK_REASONS.map(reason => (
                                   <button 
                                     key={reason}
                                     onClick={() => updateFeedbackReason(i, reason)}
                                     className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                                       feedback.reason === reason 
                                         ? 'bg-red-50 border-red-200 text-red-600' 
                                         : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                                     }`}
                                   >
                                     {reason}
                                   </button>
                                 ))}
                              </div>

                              <textarea 
                                value={feedback.detail}
                                onChange={(e) => updateFeedbackDetail(i, e.target.value)}
                                placeholder="请补充具体问题（可选）..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition-all h-20 resize-none mb-3 placeholder:text-slate-400"
                              />

                              <div className="flex justify-end">
                                 <button 
                                   onClick={() => submitFeedback(i)}
                                   disabled={!feedback.reason}
                                   className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                 >
                                   提交反馈
                                 </button>
                              </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-[1.75rem] rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400">正在思考...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} className="h-10" />
      </div>

      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
           <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-200 rounded-[1.5rem] p-2 pl-6 focus-within:bg-white focus-within:border-blue-500 transition-all shadow-inner">
              <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="输入后续问题..." className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-3" />
              <button onClick={handleSendMessage} disabled={!inputMessage.trim() || chatLoading} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 disabled:opacity-30 transition-all"><Send size={20}/></button>
           </div>
        </div>
      </div>
    </div>
  );
};
