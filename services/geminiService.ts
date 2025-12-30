
import { GoogleGenAI, Type } from "@google/genai";
import { CompanyReport, ChatMessage } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper definition for Source Schema part
const sourceSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "来源网站名称或文章标题" },
      url: { type: Type.STRING, description: "可验证的URL链接（必须以 http 开头）" }
    }
  },
  description: "该信息的数据来源列表。"
};

// Schema for structured company report
const companyReportSchema: any = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING, description: "公司官方名称" },
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        overview: { type: Type.STRING, description: "业务概览。请在核心动向处使用 **[重要动态] 文本** 标注。" },
        foundingDate: { type: Type.STRING, description: "成立年份" },
        headquarters: { type: Type.STRING, description: "总部地点" },
        industry: { type: Type.STRING, description: "主要行业" },
        fundingStatus: { type: Type.STRING, description: "最新状态" },
        sources: sourceSchema
      },
      required: ["overview", "industry"]
    },
    keyPeople: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          department: { type: Type.STRING },
          sources: sourceSchema
        }
      }
    },
    opportunities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["招标", "招聘", "咨询"] },
          description: { type: Type.STRING, description: "商机描述。请在核心需求处使用 **[商机信号] 文本** 标注。" },
          interventionStrategy: { type: Type.STRING, description: "基于具体商机信息的介入建议。例如：如果是招聘，分析其技术栈缺口推荐我方产品；如果是招标，分析其标书偏好。" },
          sources: sourceSchema
        },
        required: ["title", "description", "interventionStrategy"]
      }
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ["低", "中", "高"] },
          category: { type: Type.STRING },
          description: { type: Type.STRING, description: "风险描述。请在核心风险点处使用 **[风险预警] 文本** 标注。" },
          sources: sourceSchema
        }
      }
    },
    salesStrategy: { type: Type.STRING, description: "针对性的策略建议。请在核心方案处使用 **[销售策略] 文本** 标注。" }
  },
  required: ["companyName", "basicInfo", "salesStrategy"]
};

export const generateCompanyAnalysis = async (companyName: string, focusAreas?: string[], userCapabilities?: string): Promise<CompanyReport> => {
  try {
    const focusContext = focusAreas && focusAreas.length > 0 
      ? `特别关注维度：${focusAreas.join('、')}。` 
      : '';

    const capabilityContext = userCapabilities 
      ? `\n我方核心能力背景：“${userCapabilities}”。分析商机介入建议时，必须结合我方能力给出具体切入点。` 
      : '';

    const prompt = `
      请作为资深商业分析专家，深度研判 "${companyName}"。
      
      【排版与结构要求】
      1. 条理分明：描述性文字必须分段，段落之间使用双换行符（\n\n）分隔。
      2. 列表化：在描述多个要点时，优先使用列表符号（• ）。
      3. **来源追踪**：请务必在 basicInfo, opportunities, risks 中提供真实的或基于搜索的参考来源 URL (sources)。
      
      【标注规范 (核心)】
      1. 使用 Markdown **加粗** 来标注重点。
      2. 极简原则：每段文字仅允许 1-2 个重点，严禁过度标注。
      3. 分类前缀：重点内容必须包含以下前缀之一：
         - **[重要动态]** (用于业务现状)
         - **[关键角色]** (用于人物)
         - **[商机信号]** (用于业务机会)
         - **[风险预警]** (用于负面风险)
         - **[销售策略]** (用于切入建议)
      
      【分析内容要求】
      - 业务概览、组织架构、商机捕捉、舆情风险。
      - 商机部分 (opportunities) 必须包含具体的介入建议 (interventionStrategy)。
         - 若为招聘信息：请分析招聘职位透漏出的技术栈或业务扩张方向，建议如何对接。
         - 若为招标信息：请分析招标需求的侧重点，建议如何准备标书。
      - 定制策略：${capabilityContext}
      
      ${focusContext}
      请直接返回符合 Schema 的 JSON 对象。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: companyReportSchema,
        tools: [{googleSearch: {}}], // Enable search to get real URLs
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("API 无响应");
    
    return JSON.parse(text) as CompanyReport;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const chatWithAgent = async (history: ChatMessage[], newMessage: string, context?: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      })),
      config: {
        systemInstruction: `你是企业专家分析助手。背景：${context || '无'}。
        
        回答要求：
        1. 结构清晰，分段明确。
        2. 标注要精简，使用 **[结论]** 或 **[关键点]** 前缀。
        3. 如果回答包含步骤，请使用 1. 2. 3. 序号并换行。
        4. 如果引用了具体信息，请尽量提供来源链接，格式为 [标题](URL)。`
      }
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "抱歉，暂无法回答。";
  } catch (error) {
    return "系统错误，请重试。";
  }
};
