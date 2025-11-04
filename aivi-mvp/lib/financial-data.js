// 简化的财务数据获取和估值计算
import axios from 'axios';

// 模拟财务数据（实际项目中应该从真实API获取）
const mockFinancialData = {
  'AAPL': {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    marketCap: 3000000000000, // 3万亿
    revenue: 394328000000, // 3943亿
    operatingIncome: 114301000000, // 1143亿
    netIncome: 99803000000, // 998亿
    totalAssets: 352755000000, // 3528亿
    totalDebt: 122797000000, // 1228亿
    cash: 29965000000, // 300亿
    sharesOutstanding: 15550000000, // 155.5亿股
    currentPrice: 193.58,
    // 简化数据
    capex: 11085000000, // 111亿
    depreciation: 12547000000, // 125亿
    workingCapital: 5000000000, // 50亿
  },
  'MSFT': {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    marketCap: 2800000000000, // 2.8万亿
    revenue: 211915000000, // 2119亿
    operatingIncome: 88383000000, // 884亿
    netIncome: 83383000000, // 834亿
    totalAssets: 411976000000, // 4120亿
    totalDebt: 60000000000, // 600亿
    cash: 111000000000, // 1110亿
    sharesOutstanding: 7430000000, // 74.3亿股
    currentPrice: 377.44,
    capex: 23800000000, // 238亿
    depreciation: 15000000000, // 150亿
    workingCapital: 20000000000, // 200亿
  }
};

export class FinancialDataService {
  static async getCompanyData(ticker) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = mockFinancialData[ticker.toUpperCase()];
    if (!data) {
      throw new Error(`Company data not found for ticker: ${ticker}`);
    }
    
    return data;
  }
  
  static async getStockPrice(ticker) {
    // 模拟实时价格获取
    await new Promise(resolve => setTimeout(resolve, 200));
    const data = mockFinancialData[ticker.toUpperCase()];
    return data ? data.currentPrice : null;
  }
}

export class ValuationEngine {
  static calculateReproductionCost(companyData) {
    const { totalAssets, totalDebt, cash, workingCapital } = companyData;
    
    // 简化的再造成本计算
    // 有形资产 + 营运资金 - 债务 + 现金
    const tangibleAssets = totalAssets * 0.8; // 假设80%为有形资产
    const reproductionCost = tangibleAssets + workingCapital - totalDebt + cash;
    
    return {
      tangibleAssets,
      workingCapital,
      netDebt: totalDebt - cash,
      reproductionCost,
      perShare: reproductionCost / companyData.sharesOutstanding
    };
  }
  
  static calculateEPV(companyData) {
    const { operatingIncome, depreciation, capex, sharesOutstanding } = companyData;
    
    // 简化的EPV计算
    // 正常化营业利润 + 折旧 - 维护性资本支出
    const normalizedOperatingIncome = operatingIncome;
    const maintenanceCapex = depreciation; // 简化：维护性资本支出约等于折旧
    const freeCashFlow = normalizedOperatingIncome + depreciation - maintenanceCapex;
    
    // 使用保守折现率10%
    const discountRate = 0.10;
    const epv = freeCashFlow / discountRate;
    
    return {
      normalizedOperatingIncome,
      maintenanceCapex,
      freeCashFlow,
      discountRate,
      epv,
      perShare: epv / sharesOutstanding
    };
  }
  
  static calculateMarginOfSafety(currentPrice, intrinsicValue) {
    const margin = (intrinsicValue - currentPrice) / currentPrice;
    return {
      margin,
      percentage: margin * 100,
      recommendation: margin > 0.2 ? 'BUY' : margin > 0.1 ? 'HOLD' : 'AVOID'
    };
  }
}

export class ICPersona {
  static getPersonas() {
    return [
      {
        id: 'buffett',
        name: 'Warren Buffett',
        style: 'Value investing, long-term focus, moat analysis',
        expertise: ['Consumer', 'Financial', 'Insurance'],
        weight: 1.2
      },
      {
        id: 'munger',
        name: 'Charlie Munger',
        style: 'Mental models, quality over quantity, psychological insights',
        expertise: ['Conglomerate', 'Consumer', 'Real Estate'],
        weight: 1.0
      },
      {
        id: 'klarman',
        name: 'Seth Klarman',
        style: 'Deep value, margin of safety, contrarian thinking',
        expertise: ['Special Situations', 'Distressed', 'Value'],
        weight: 1.3
      }
    ];
  }
  
  static async simulateICMeeting(companyData, valuation) {
    const personas = this.getPersonas();
    const currentPrice = companyData.currentPrice;
    const intrinsicValue = valuation.epv.perShare;
    
    const reviews = personas.map(persona => {
      // 简化的评分逻辑
      const marginOfSafety = (intrinsicValue - currentPrice) / currentPrice;
      
      let score = 3; // 基础分
      
      // Buffett风格：关注护城河和长期价值
      if (persona.id === 'buffett') {
        score += marginOfSafety > 0.2 ? 1.5 : marginOfSafety > 0.1 ? 0.5 : -1;
        score += companyData.revenue > 100000000000 ? 0.5 : -0.5; // 规模优势
      }
      
      // Munger风格：关注质量和心理模型
      if (persona.id === 'munger') {
        score += companyData.operatingIncome / companyData.revenue > 0.2 ? 1 : -0.5; // 利润率
        score += marginOfSafety > 0.15 ? 1 : 0;
      }
      
      // Klarman风格：关注深度价值和安全边际
      if (persona.id === 'klarman') {
        score += marginOfSafety > 0.3 ? 2 : marginOfSafety > 0.2 ? 1 : -1;
        score += companyData.cash > companyData.totalDebt ? 0.5 : -0.5; // 财务稳健性
      }
      
      score = Math.max(1, Math.min(5, score)); // 限制在1-5分
      
      return {
        persona,
        score: Math.round(score * 10) / 10,
        comment: this.generateComment(persona, companyData, valuation, marginOfSafety),
        recommendation: score >= 4 ? 'BUY' : score >= 3 ? 'HOLD' : 'AVOID'
      };
    });
    
    return {
      reviews,
      averageScore: reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length,
      consensus: this.getConsensus(reviews)
    };
  }
  
  static generateComment(persona, companyData, valuation, marginOfSafety) {
    const comments = {
      buffett: `"${companyData.name} shows strong fundamentals with ${(companyData.operatingIncome/companyData.revenue*100).toFixed(1)}% operating margin. The moat appears sustainable, and at current prices, we're getting good value for a quality business."`,
      munger: `"This investment requires understanding the business model deeply. The psychological factors favor long-term holders, and the quality metrics suggest this could compound wealth over time."`,
      klarman: `"The margin of safety is ${(marginOfSafety*100).toFixed(1)}%, which ${marginOfSafety > 0.2 ? 'provides adequate protection' : 'may be insufficient'}. Risk-adjusted returns look ${marginOfSafety > 0.2 ? 'attractive' : 'questionable'}."`
    };
    
    return comments[persona.id] || "Further analysis needed.";
  }
  
  static getConsensus(reviews) {
    const buyCount = reviews.filter(r => r.recommendation === 'BUY').length;
    const holdCount = reviews.filter(r => r.recommendation === 'HOLD').length;
    const avoidCount = reviews.filter(r => r.recommendation === 'AVOID').length;
    
    if (buyCount > holdCount && buyCount > avoidCount) return 'BUY';
    if (holdCount > avoidCount) return 'HOLD';
    return 'AVOID';
  }
}


