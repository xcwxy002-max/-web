
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { generateCompanyAnalysis, chatWithAgent } from '../services/geminiService';
import { useAppContext } from '../context/AppContext';
import { CompanyReport, ChatMessage, DataSource, HistoryItem, HistoryCategory } from '../types';
import { 
  Building2, Send, Loader2, CheckCircle, Globe, 
  ExternalLink, Bot, User as UserIcon, ArrowLeft, Zap, Sparkles,
  Compass, Info, AlertCircle, TrendingUp, Lightbulb, Printer,
  FileText, Link as LinkIcon, ChevronUp, ChevronDown, ThumbsDown, MessageSquareWarning, X
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Feedback constants
const FEEDBACK_REASONS = ["数据错误", "信息滞后", "逻辑漏洞", "答非所问", "格式混乱", "其他"];

interface FeedbackState {
  isOpen: boolean;
  submitted: boolean;
  reason: string | null;
  detail: string;
}

const RichText: React.FC<{ text: string; isUser?: boolean }> = ({ text, isUser = false }) => {
  if (!text) return null;

  const processText = (content: string) => {
    // Regex matches bold (**...**) OR links ([...](...))
    const regex = /(\*\*.*?\*\*)|(\[.*?\]\(.*?\))/g;
    return content.split(regex).map((part, i) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        
        // Default style for User vs Model
        let styleClass = isUser 
          ? "bg-white/20 text-white border-white/30" 
          : "bg-slate-100 text-slate-700 border-slate-200";
        
        let Icon = Info;
        
        // Only apply special coloring for Model messages
        if (!isUser) {
          if (inner.includes('[风险预警]')) { styleClass = "bg-red-50 text-red-700 border-red-200"; Icon = AlertCircle; }
          else if (inner.includes('[商机信号]')) { styleClass = "bg-green-50 text-green-700 border-green-200"; Icon = TrendingUp; }
          else if (inner.includes('[销售策略]') || inner.includes('[结论]') || inner.includes('[介入建议]')) { styleClass = "bg-purple-50 text-purple-700 border-purple-200"; Icon = Lightbulb; }
          else if (inner.includes('[重要动态]') || inner.includes('[关键点]')) { styleClass = "bg-blue-50 text-blue-700 border-blue-200"; Icon = Sparkles; }
        } else {
          // For user, use a generic white icon style
          Icon = Sparkles;
        }
        
        return (
          <strong key={i} className={`inline-flex items-center gap-1 px-1.5 py-0 rounded border font-black mx-0.5 text-[11px] ${styleClass}`}>
            <Icon size={10} className="flex-shrink-0" /> {inner}
          </strong>
        );
      } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
           return (
             <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 hover:underline mx-1 text-[12px] font-medium px-1.5 py-0.5 rounded transition-colors ${isUser ? 'text-white bg-white/20 hover:bg-white/30' : 'text-blue-600 bg-blue-50 hover:text-blue-800'}`}>
               <LinkIcon size={10} /> {match[1]}
             </a>
           );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const processParagraph = (p: string) => {
    const lines = p.split('\n');
    const isList = lines.every(l => l.trim().startsWith('•') || l.trim().startsWith('-') || /^\d+\./.test(l.trim()));
    if (isList && lines.length > 1) {
      return (
        <div className="grid grid-cols-1 gap-2 my-1.5">
          {lines.map((line, idx) => (
            <div key={idx} className={`p-2 rounded-lg text-[12px] flex items-start gap-2 group transition-all border ${isUser ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-white hover:border-blue-200'}`}>
              <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${isUser ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>{idx + 1}</div>
              <span className={`flex-1 leading-snug ${isUser ? 'text-white' : 'text-slate-700'}`}>{processText(line.replace(/^[•-\d.]\s*/, ''))}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <p className={`whitespace-pre-wrap leading-relaxed text-[13px] block my-1 ${isUser ? 'text-white' : 'text-slate-700'}`}>
        {processText(p)}
      </p>
    );
  };
  return <div className="space-y-3">{text.split('\n\n').map((para, i) => <div key={i}>{processParagraph(para)}</div>)}</div>;
};

export const AgentExecution: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const companyNameParam = searchParams.get('company');
  const queryParam = searchParams.get('query');
  const categoryParam = (searchParams.get('category') as HistoryCategory) || HistoryCategory.REGULAR;
  const contextParam = searchParams.get('context');
  const focusParam = searchParams.get('focus');
  const focusAreas = focusParam ? JSON.parse(focusParam) : [];
  
  const { addToHistory, followCompany, followedCompanies, user } = useAppContext();
  const historyState = location.state as { historyItem: HistoryItem } | undefined;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<number>>(new Set());
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackState>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (historyState?.historyItem?.reportData) {
      setReport(historyState.historyItem.reportData);
      setMessages(historyState.historyItem.chatHistory || []);
      setLoading(false);
    } else if (companyNameParam) {
      startEnterpriseExecution(companyNameParam);
    } else if (queryParam) {
      startGenericExecution(queryParam, contextParam);
    }
  }, [companyNameParam, queryParam]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const updateThinkingMessage = (text: string) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.role === 'model' && lastMsg.text.includes('...')) {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: 'model', text: `🔄 ${text}` };
        return newHistory;
      } else {
        return [...prev, { role: 'model', text: `🔄 ${text}` }];
      }
    });
  };

  const toggleMessage = (index: number) => {
    setCollapsedMessages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Feedback Handlers
  const toggleFeedbackForm = (index: number) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        isOpen: !prev[index]?.isOpen,
        submitted: prev[index]?.submitted || false,
        reason: prev[index]?.reason || null,
        detail: prev[index]?.detail || ''
      }
    }));
  };

  const updateFeedbackReason = (index: number, reason: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], reason }
    }));
  };

  const updateFeedbackDetail = (index: number, detail: string) => {
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], detail }
    }));
  };

  const submitFeedback = (index: number) => {
    // Here you would typically send to API
    console.log("Feedback submitted:", feedbacks[index]);
    setFeedbacks(prev => ({
      ...prev,
      [index]: { ...prev[index], submitted: true, isOpen: false }
    }));
  };

  const formatSources = (sources?: DataSource[]) => {
    if (!sources || sources.length === 0) return '';
    const links = sources.map(s => `[${s.title}](${s.url})`).join(' ');
    return `\n🔗 **来源**: ${links}`;
  };

  const startEnterpriseExecution = async (name: string) => {
    setLoading(true);
    setMessages([{ role: 'model', text: "🔄 初始化分析引擎..." }]);
    
    const steps = ["正在接入多源数据...", "正在进行逻辑关系研判...", "正在构建策略报告框架..."];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 800));
      updateThinkingMessage(step);
    }

    try {
      const result = await generateCompanyAnalysis(name, focusAreas, user.businessCapabilities);
      setReport(result);

      // 构建商机部分的显示文本，包含介入建议和来源
      const opportunitiesText = result.opportunities.map(o => {
        const sourceStr = formatSources(o.sources);
        return `• [${o.type}] **${o.title}**: ${o.description}\n   🚀 **[介入建议]**: ${o.interventionStrategy}${sourceStr}`;
      }).join('\n\n');

      const basicInfoSource = formatSources(result.basicInfo.sources);
      const riskText = result.risks.length > 0 
        ? `\n\n⚠️ **潜在风险**\n${result.risks.map(r => `• [${r.severity}] **[风险预警] ${r.category}**: ${r.description} ${formatSources(r.sources)}`).join('\n')}`
        : '';

      const analysisMessages: ChatMessage[] = [
        { role: 'model', text: `✅ **分析报告生成完毕**\n\n**🏢 企业基础画像**\n${result.basicInfo.overview}\n\n📍 总部：${result.basicInfo.headquarters} | 行业：${result.basicInfo.industry} | 状态：${result.basicInfo.fundingStatus}${basicInfoSource}` },
        { role: 'model', text: `💡 **核心商机情报 & 介入建议**\n\n${opportunitiesText}` },
        { role: 'model', text: `🎯 **推荐销售策略**\n${result.salesStrategy}${riskText}` }
      ];
      
      setMessages(analysisMessages);
      addToHistory({ id: generateId(), category: HistoryCategory.MONITORING, query: name, date: new Date().toLocaleDateString(), summary: `企业分析: ${result.companyName}`, reportData: result, chatHistory: analysisMessages });
    } catch (err) { 
      setMessages([{ role: 'model', text: "❌ **任务执行失败**：未能获取到该企业有效深度数据或网络超时。" }]); 
    }
    finally { setLoading(false); }
  };

  const startGenericExecution = async (q: string, context?: string | null) => {
    setLoading(true);
    setMessages([{ role: 'model', text: "🔄 正在挂载政策上下文..." }]);
    
    const steps = ["正在提取核心条款...", "正在生成解读视角..."];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 600));
      updateThinkingMessage(step);
    }

    const initialPrompt = context ? `针对该内容：${context}\n\n请进行深度解读：` : `请研判：${q}`;
    const responseText = await chatWithAgent([], initialPrompt, "行业政策解读模式");
    const initialMsg: ChatMessage[] = [
      { role: 'user', text: q },
      { role: 'model', text: responseText }
    ];
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
    .filter(m => m.role === 'model' && !m.text.includes('🔄'))
    .map((m, i) => {
      let label = `回复 #${i + 1}`;
      if (report && i === 0) label = "基础画像";
      if (report && i === 1) label = "商机情报";
      if (report && i === 2) label = "销售策略";
      return { label, index: m.index };
    });

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
                <h2 className="text-sm font-black text-slate-900 leading-none">{report?.companyName || queryParam || '智能研判中...'}</h2>
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
          {messages.map((msg, i) => {
            const isCollapsed = collapsedMessages.has(i);
            const isThinking = msg.text.includes('🔄');
            const feedback = feedbacks[i] || { isOpen: false, submitted: false, reason: null, detail: '' };

            return (
              <div key={i} ref={el => messageRefs.current[i] = el} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                <div className={`flex gap-4 max-w-[95%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-300 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                      : 'bg-white text-blue-600 border-slate-100 shadow-xl group-hover:scale-110'
                  }`}>
                    {msg.role === 'user' ? <UserIcon size={18}/> : <Bot size={18}/>}
                  </div>
                  
                  <div className={`relative flex flex-col items-${msg.role === 'user' ? 'end' : 'start'}`}>
                    <div className={`p-6 rounded-[1.75rem] shadow-sm border transition-all relative group/bubble ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-lg shadow-blue-500/20' 
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-none font-medium'
                    }`}>
                      
                      {!isThinking && (
                        <button 
                          onClick={() => toggleMessage(i)} 
                          className={`absolute top-3 right-3 p-1.5 rounded-full transition-all opacity-0 group-hover/bubble:opacity-100 z-10 ${
                            msg.role === 'user' 
                              ? 'text-white/50 hover:text-white hover:bg-white/20' 
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                        </button>
                      )}

                      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-[3.5rem] overflow-hidden' : ''}`}>
                        {isThinking ? (
                           <div className="flex items-center gap-3 text-blue-600 animate-pulse">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="font-bold">{msg.text.replace('🔄', '').trim()}</span>
                           </div>
                        ) : (
                           <RichText text={msg.text} isUser={msg.role === 'user'} />
                        )}
                      </div>
                      
                      {isCollapsed && (
                         <div className={`absolute bottom-1 right-8 text-[9px] font-bold uppercase tracking-widest pointer-events-none ${
                            msg.role === 'user' ? 'text-blue-200/50' : 'text-slate-300'
                         }`}>
                            ...
                         </div>
                      )}
                    </div>

                    {/* Feedback Button & Form (Only for Model) */}
                    {msg.role === 'model' && !isThinking && (
                      <div className="mt-2 ml-2 relative">
                         {!feedback.isOpen && !feedback.submitted && (
                            <button 
                              onClick={() => toggleFeedbackForm(i)}
                              className="flex items-center gap-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2 py-1 rounded-full hover:bg-red-50"
                              title="反馈结果不佳"
                            >
                               <ThumbsDown size={14} />
                               <span className="text-[10px] font-bold">反馈</span>
                            </button>
                         )}
                         
                         {feedback.submitted && (
                            <div className="flex items-center gap-1.5 text-slate-400 px-2 py-1">
                               <CheckCircle size={14} className="text-emerald-500" />
                               <span className="text-[10px] font-bold">已反馈</span>
                            </div>
                         )}

                         {feedback.isOpen && !feedback.submitted && (
                           <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 mt-1 w-[320px] animate-fadeIn origin-top-left z-20">
                              <div className="flex items-center justify-between mb-3">
                                 <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                                   <MessageSquareWarning size={14} className="text-red-500"/>
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
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-300 shadow-sm"><Bot size={18}/></div>
                <div className="bg-white px-6 py-4 rounded-[1.75rem] rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="flex gap-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></div></div>
                </div>
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
