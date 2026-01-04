
import React, { createContext, useContext, useState } from 'react';
import { User, Industry, FollowedCompany, HistoryItem, UserRole, HistoryCategory } from '../types';

interface AppContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  followedCompanies: FollowedCompany[];
  followCompany: (company: FollowedCompany) => void;
  unfollowCompany: (id: string) => void;
  markAsRead: (companyId: string) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
}

const defaultUser: User = {
  name: "陈亚历",
  email: "alex.chen@enterprise.com",
  industry: [Industry.TECHNOLOGY],
  role: UserRole.SALES,
  avatar: "https://picsum.photos/200",
  businessCapabilities: "我们提供企业级云计算解决方案、大数据分析平台以及AI智能客服系统。"
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [followedCompanies, setFollowedCompanies] = useState<FollowedCompany[]>([
    { 
      id: '1', 
      name: '科技集团有限公司', 
      dateAdded: '2023-10-25', 
      industry: '云计算',
      recentUpdates: [
        { id: 'u1', text: '发布“核心业务系统迁移”招标项目，预算800万', date: '2025-05-20', isRead: false, type: '招标' },
        { id: 'u2', text: '正在招聘“高级云架构师”，侧重混合云治理', date: '2025-05-18', isRead: true, type: '招聘' }
      ],
      opportunities: []
    },
    { 
      id: '2', 
      name: '未来能源动力', 
      dateAdded: '2023-11-02', 
      industry: '新能源',
      recentUpdates: [
        { id: 'u3', text: '财报显示Q1数字化转型预算增长30%', date: '2025-05-19', isRead: false, type: '财报' }
      ],
      opportunities: []
    }
  ]);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const updateUser = (updates: Partial<User>) => setUser(prev => ({ ...prev, ...updates }));

  const followCompany = (company: FollowedCompany) => {
    if (!followedCompanies.find(c => c.name === company.name)) {
      setFollowedCompanies(prev => [company, ...prev]);
    }
  };

  const unfollowCompany = (id: string) => {
    setFollowedCompanies(prev => prev.filter(c => c.id !== id));
  };

  const markAsRead = (companyId: string) => {
    setFollowedCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return { ...c, recentUpdates: c.recentUpdates.map(u => ({ ...u, isRead: true })) };
      }
      return c;
    }));
  };

  const addToHistory = (item: HistoryItem) => setHistory(prev => [item, ...prev]);

  return (
    <AppContext.Provider value={{ 
      user, updateUser, followedCompanies, followCompany, unfollowCompany, markAsRead, history, addToHistory
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
