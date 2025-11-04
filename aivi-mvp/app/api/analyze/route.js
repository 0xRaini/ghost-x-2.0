import { NextResponse } from 'next/server';
import { FinancialDataService, ValuationEngine, ICPersona } from '../../../lib/financial-data.js';

export async function POST(request) {
  try {
    const { ticker } = await request.json();
    
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }
    
    // 获取公司数据
    const companyData = await FinancialDataService.getCompanyData(ticker);
    
    // 计算估值
    const reproductionCost = ValuationEngine.calculateReproductionCost(companyData);
    const epv = ValuationEngine.calculateEPV(companyData);
    
    // IC模拟
    const icMeeting = await ICPersona.simulateICMeeting(companyData, { epv });
    
    // 计算安全边际
    const marginOfSafety = ValuationEngine.calculateMarginOfSafety(
      companyData.currentPrice, 
      epv.perShare
    );
    
    const analysis = {
      company: {
        ticker: companyData.ticker,
        name: companyData.name,
        currentPrice: companyData.currentPrice,
        marketCap: companyData.marketCap,
        revenue: companyData.revenue,
        operatingIncome: companyData.operatingIncome
      },
      valuation: {
        reproductionCost: reproductionCost.perShare,
        epv: epv.perShare,
        marginOfSafety: marginOfSafety.percentage,
        recommendation: marginOfSafety.recommendation
      },
      icMeeting: {
        reviews: icMeeting.reviews,
        averageScore: icMeeting.averageScore,
        consensus: icMeeting.consensus
      },
      summary: {
        intrinsicValue: epv.perShare,
        currentPrice: companyData.currentPrice,
        upside: ((epv.perShare - companyData.currentPrice) / companyData.currentPrice * 100).toFixed(1) + '%',
        riskLevel: marginOfSafety.percentage > 20 ? 'Low' : marginOfSafety.percentage > 10 ? 'Medium' : 'High'
      }
    };
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' }, 
      { status: 500 }
    );
  }
}


