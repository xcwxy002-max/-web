
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Shield, Save, Lock, Sparkles, Building, Mail } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAppContext();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('安全密码已更新');
    setTimeout(() => setMessage(''), 3000);
    setPassword('');
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 animate-fadeIn">
       {/* 头部装饰性个人信息 */}
       <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white relative overflow-hidden shadow-lg mb-6">
          <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10">
             <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden">
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-lg border-2 border-slate-900 shadow-xl text-white">
                  <Sparkles size={10} />
                </div>
             </div>
             <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                   <h2 className="text-xl font-black tracking-tight">{user.name}</h2>
                   <span className="bg-blue-600/20 text-blue-400 px-3 py-0.5 rounded-full border border-blue-400/20 text-[8px] font-black uppercase tracking-widest">{user.role}</span>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                     <Mail size={12} className="text-blue-500" /> {user.email}
                   </div>
                   <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                     <Building size={12} className="text-blue-500" /> 商业研判部
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* 核心配置项 - 仅保留密码修改 */}
       <section className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
              <Shield size={16} className="text-blue-600" /> 安全设置
            </h3>
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Security Certified</span>
          </div>
          
          <div className="space-y-4 max-w-md">
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">修改安全密码</label>
                <div className="relative">
                   <input 
                      type="password" 
                      placeholder="请输入新密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                   />
                   <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
             </div>
             
             <div className="pt-2 flex items-center gap-4">
                <button 
                   onClick={handleSave}
                   disabled={!password}
                   className="bg-slate-900 text-white font-black px-6 py-2.5 rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <Save size={14} /> 保存新密码
                </button>
                {message && <p className="text-[10px] font-bold text-emerald-600 animate-pulse">{message}</p>}
             </div>
          </div>
       </section>

       <div className="mt-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-900/60 font-medium leading-relaxed">
            为了您的账户安全，建议定期更换密码。如需修改其他个人信息（如职位、部门等），请联系系统管理员。
          </p>
       </div>
    </div>
  );
};
