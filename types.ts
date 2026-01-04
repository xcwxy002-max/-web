
export enum Industry {
  TECHNOLOGY = '科技',
  FINANCE = '金融',
  MANUFACTURING = '制造',
  HEALTHCARE = '医疗',
  ENERGY = '能源'
}

export enum UserRole {
  SALES = '销售',
  LEGAL = '法务',
  PROCUREMENT = '采购',
  MANAGEMENT = '管理层'
}

export enum HistoryCategory {
  REGULAR = '常规对话',
  POLICY = '行业政策研判',
  MONITORING = '企业商机监控'
}

export interface AgentApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: HistoryCategory;
  placeholder: string;
  color: string;
}

export interface Policy {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  source: string;
  date: string;
  industry: Industry;
}

export interface DataSource {
  title: string;
  url: string;
}

export interface CompanyUpdate {
  id: string;
  text: string;
  date: string;
  isRead: boolean;
  type: '招标' | '招聘' | '咨询' | '财报';
}

export interface FollowedCompany {
  id: string;
  name: string;
  dateAdded: string;
  industry?: string;
  recentUpdates: CompanyUpdate[];
  opportunities: {
    title: string;
    type: '招标' | '招聘' | '咨询';
    description: string;
    interventionStrategy?: string;
    sources?: DataSource[];
  }[];
}

export interface User {
  name: string;
  email: string;
  industry: Industry[]; 
  role: UserRole;
  avatar: string;
  businessCapabilities: string;
}

export interface HistoryItem {
  id: string;
  category: HistoryCategory;
  query: string;
  date: string;
  summary: string;
  reportData?: CompanyReport;
  chatHistory?: ChatMessage[];
}

export interface CompanyReport {
  companyName: string;
  basicInfo: {
    overview: string;
    foundingDate: string;
    headquarters: string;
    industry: string;
    fundingStatus: string;
    sources?: DataSource[];
  };
  keyPeople: {
    name: string;
    role: string;
    department?: string;
    sources?: DataSource[];
  }[];
  opportunities: {
    title: string;
    type: '招标' | '招聘' | '咨询';
    description: string;
    interventionStrategy: string;
    sources?: DataSource[];
  }[];
  risks: {
    severity: '低' | '中' | '高';
    category: string;
    description: string;
    sources?: DataSource[];
  }[];
  salesStrategy: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
