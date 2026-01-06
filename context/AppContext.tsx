
import React, { createContext, useContext, useState } from 'react';
import { User, Industry, FollowedCompany, HistoryItem, UserRole, HistoryCategory, AgentApp, DashboardWidget } from '../types';

interface AppContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  followedCompanies: FollowedCompany[];
  followCompany: (company: FollowedCompany) => void;
  unfollowCompany: (id: string) => void;
  markAsRead: (companyId: string) => void;
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  // 新增 Agent 和 布局管理
  agents: AgentApp[];
  toggleAgentPin: (agentId: string) => void;
  reorderAgents: (newOrderIds: string[]) => void; 
  dashboardWidgets: DashboardWidget[];
  toggleWidgetVisibility: (widgetId: string) => void;
  reorderWidgets: (dragIndex: number, hoverIndex: number) => void;
}

const defaultUser: User = {
  name: "陈亚历",
  email: "alex.chen@enterprise.com",
  industry: [Industry.TECHNOLOGY],
  role: UserRole.SALES,
  avatar: "https://picsum.photos/200",
  businessCapabilities: "我们提供企业级云计算解决方案、大数据分析平台以及AI智能客服系统。"
};

const INITIAL_AGENTS: AgentApp[] = [
  {
    id: 'enterprise-analyst',
    name: '企业研报专家',
    description: '深度挖掘核心商机与风险',
    icon: 'Building2',
    category: HistoryCategory.MONITORING,
    placeholder: '输入目标企业全称，启动深度研判...',
    color: 'blue',
    pinned: true,
    features: ['chat', 'history']
  },
  {
    id: 'bid-expert',
    name: '招投标助手',
    description: '解析招标文件并生成策略',
    icon: 'Gavel',
    category: HistoryCategory.REGULAR,
    placeholder: '粘贴招标文件内容或输入项目名称...',
    color: 'indigo',
    pinned: true,
    features: ['chat', 'history']
  },
  {
    id: 'policy-tracker',
    name: '政策风控官',
    description: '追踪行业规制及业务影响',
    icon: 'Newspaper',
    category: HistoryCategory.POLICY,
    placeholder: '输入政策关键词或粘贴政策原文...',
    color: 'emerald',
    pinned: true,
    features: ['chat', 'history']
  }
];

const INITIAL_WIDGETS: DashboardWidget[] = [
  { id: 'w-monitor', type: 'monitoring', title: '企业商机情报雷达', visible: true, order: 0 },
  { id: 'w-stats', type: 'stats', title: '整体数据概览', visible: false, order: 1 } // 示例隐藏组件
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(defaultUser);
  const [agents, setAgents] = useState<AgentApp[]>(INITIAL_AGENTS);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>(INITIAL_WIDGETS);
  
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

  const toggleAgentPin = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, pinned: !a.pinned } : a));
  };

  // Agent 排序：接收新的 ID 列表，未在列表中的（未固定的）将追加在后面
  const reorderAgents = (newOrderIds: string[]) => {
    const agentMap = new Map(agents.map(a => [a.id, a]));
    const newAgents = newOrderIds.map(id => agentMap.get(id)).filter((a): a is AgentApp => !!a);
    
    // 找出未在 newOrderIds 中的 agents (通常是未 pinned 的)，保持它们在数组末尾
    const processedIds = new Set(newOrderIds);
    const remainingAgents = agents.filter(a => !processedIds.has(a.id));
    
    setAgents([...newAgents, ...remainingAgents]);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setDashboardWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, visible: !w.visible } : w));
  };

  const reorderWidgets = (dragIndex: number, hoverIndex: number) => {
    if (hoverIndex < 0 || hoverIndex >= dashboardWidgets.length) return;
    const newWidgets = [...dashboardWidgets];
    const draggedItem = newWidgets[dragIndex];
    newWidgets.splice(dragIndex, 1);
    newWidgets.splice(hoverIndex, 0, draggedItem);
    setDashboardWidgets(newWidgets.map((w, index) => ({ ...w, order: index })));
  };

  return (
    <AppContext.Provider value={{ 
      user, updateUser, followedCompanies, followCompany, unfollowCompany, markAsRead, history, addToHistory,
      agents, toggleAgentPin, reorderAgents, dashboardWidgets, toggleWidgetVisibility, reorderWidgets
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
