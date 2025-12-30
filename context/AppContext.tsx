
import React, { createContext, useContext, useState } from 'react';
import { User, Industry, FollowedCompany, HistoryItem, UserRole, HistoryCategory } from '../types';

interface AppContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  followedCompanies: FollowedCompany[];
  followCompany: (company: FollowedCompany) => void;
  unfollowCompany: (id: string) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
}

const defaultUser: User = {
  name: "陈亚历",
  email: "alex.chen@enterprise.com",
  industry: [Industry.TECHNOLOGY],
  role: UserRole.SALES,
  avatar: "https://picsum.photos/200",
  businessCapabilities: "我们提供企业级云计算解决方案、大数据分析平台以及AI智能客服系统。核心优势在于高并发处理能力和金融级安全防护。"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([
    { 
      id: '1', 
      name: '科技集团有限公司', 
      latestOpportunitySummary: '大规模企业上云迁移招标项目', 
      dateAdded: '2023-10-25', 
      industry: '云计算',
      opportunities: [
        { title: '企业上云迁移', type: '招标', description: '计划将核心业务系统迁移至混合云环境。' },
        { title: '数据中台建设', type: '咨询', description: '寻求大数据治理与中台架构咨询。' }
      ]
    }
  ]);
  
  const [history, setHistory] = useState<HistoryItem[]>([
    { 
      id: 'h1', 
      category: HistoryCategory.MONITORING, 
      query: '科技集团', 
      date: '2023-10-20', 
      summary: '已生成深度研报。',
    },
  ]);

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const followCompany = (company: FollowedCompany) => {
    if (followedCompanies.length >= 10) {
      alert("关注上限为 10 家。");
      return;
    }
    if (!followedCompanies.find(c => c.name === company.name)) {
      setFollowedCompanies(prev => [company, ...prev]);
    }
  };

  const unfollowCompany = (id: string) => {
    setFollowedCompanies(prev => prev.filter(c => c.id !== id));
  };

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => [item, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      updateUser, 
      followedCompanies, 
      followCompany, 
      unfollowCompany, 
      history, 
      addToHistory
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
