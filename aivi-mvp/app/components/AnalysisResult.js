'use client';

export default function AnalysisResult({ analysis }) {
  const { company, valuation, icMeeting, summary } = analysis;

  const formatCurrency = (value) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(2)}`;
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'BUY': return 'text-success-600 bg-success-50 border-success-200';
      case 'HOLD': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'AVOID': return 'text-danger-600 bg-danger-50 border-danger-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-success-600';
    if (score >= 3) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-lg text-gray-600">{company.ticker}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(company.currentPrice)}</p>
            <p className="text-sm text-gray-500">Current Price</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="font-semibold">{formatCurrency(company.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="font-semibold">{formatCurrency(company.revenue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Operating Income</p>
            <p className="font-semibold">{formatCurrency(company.operatingIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Operating Margin</p>
            <p className="font-semibold">{((company.operatingIncome / company.revenue) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Valuation Summary */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Valuation Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Intrinsic Value (EPV)</span>
              <span className="font-semibold">{formatCurrency(summary.intrinsicValue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Current Price</span>
              <span className="font-semibold">{formatCurrency(summary.currentPrice)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Upside Potential</span>
              <span className={`font-semibold ${summary.upside.startsWith('-') ? 'text-danger-600' : 'text-success-600'}`}>
                {summary.upside}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Risk Level</span>
              <span className={`font-semibold ${
                summary.riskLevel === 'Low' ? 'text-success-600' : 
                summary.riskLevel === 'Medium' ? 'text-warning-600' : 'text-danger-600'
              }`}>
                {summary.riskLevel}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Reproduction Cost</span>
              <span className="font-semibold">{formatCurrency(valuation.reproductionCost)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Margin of Safety</span>
              <span className={`font-semibold ${
                valuation.marginOfSafety > 20 ? 'text-success-600' : 
                valuation.marginOfSafety > 10 ? 'text-warning-600' : 'text-danger-600'
              }`}>
                {valuation.marginOfSafety.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Recommendation</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(valuation.recommendation)}`}>
                {valuation.recommendation}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* IC Meeting Results */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Investment Committee Review</h3>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">{icMeeting.averageScore.toFixed(1)}/5.0</p>
            <p className="text-sm text-gray-500">Average Score</p>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Consensus</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(icMeeting.consensus)}`}>
              {icMeeting.consensus}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {icMeeting.reviews.map((review) => (
            <div key={review.persona.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {review.persona.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{review.persona.name}</h4>
                    <p className="text-xs text-gray-500">{review.persona.style}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getScoreColor(review.score)}`}>
                    {review.score}/5.0
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(review.recommendation)}`}>
                    {review.recommendation}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology Note */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Methodology Note</h4>
        <p className="text-sm text-blue-800">
          This analysis uses simplified Greenwald valuation methods with mock data for demonstration purposes. 
          The IC simulation represents stylized personas based on public information. 
          This is a research tool only and not financial advice.
        </p>
      </div>
    </div>
  );
}


