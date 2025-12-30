
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { History as HistoryIcon, Search, FileText, ArrowRight, MessageSquare, Building2, TrendingUp } from 'lucide-react';
import { HistoryCategory } from '../types';

export const History: React.FC = () => {
  const { history } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryCategory | '全部'>('全部');

  const filteredHistory = activeTab === '全部' 
    ? history 
    : history.filter(h => h.category === activeTab);

  const handleViewHistory = (item: any) => {
    navigate(`/agent/execution`, { state: { historyItem: item } });
  };

  const tabs = ['全部', ...Object.values(HistoryCategory)];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <HistoryIcon className="text-blue-600" size={28} />
          对话历史
        </h1>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           {tabs.map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleViewHistory(item)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all cursor-pointer group flex items-center gap-6"
            >
              <div className={`p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${
                item.category === HistoryCategory.MONITORING ? 'bg-blue-50 text-blue-600' :
                item.category === HistoryCategory.POLICY ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {item.category === HistoryCategory.MONITORING ? <Building2 size={24} /> :
                 item.category === HistoryCategory.POLICY ? <TrendingUp size={24} /> :
                 <MessageSquare size={24} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-base font-black text-slate-900 truncate group-hover:text-blue-600">{item.query}</h3>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.date}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{item.summary}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="p-2 text-slate-200 group-hover:text-blue-500 transition-colors">
                 <ArrowRight size={20} />
              </div>
            </div>
          ))
        ) : (
           <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
             <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-300" />
             </div>
             <p className="text-sm font-bold text-slate-400">该分类下暂无历史对话记录</p>
           </div>
        )}
      </div>
    </div>
  );
};
