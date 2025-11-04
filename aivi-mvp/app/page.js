'use client';

import { useState } from 'react';
import AnalysisResult from './components/AnalysisResult';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AIVI</h1>
              <p className="text-sm text-gray-600">Greenwald Value Investment Analysis</p>
            </div>
            <div className="text-sm text-gray-500">
              MVP v1.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Company Analysis
          </h2>
          <form onSubmit={handleAnalyze} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Enter ticker symbol (e.g., AAPL, MSFT)"
                className="input-field"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
          
          {/* Quick Examples */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Try these examples:</p>
            <div className="flex gap-2">
              {['AAPL', 'MSFT'].map((example) => (
                <button
                  key={example}
                  onClick={() => setTicker(example)}
                  className="text-sm text-primary-600 hover:text-primary-700 underline"
                  disabled={loading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card mb-8 border-danger-200 bg-danger-50">
            <div className="flex items-center">
              <div className="text-danger-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Analysis Results */}
        {analysis && <AnalysisResult analysis={analysis} />}

        {/* Info Section */}
        {!analysis && !loading && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              About AIVI MVP
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Greenwald Three-Step Valuation:</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Reproduction Cost:</strong> Asset-based valuation</li>
                  <li><strong>EPV (Earnings Power Value):</strong> Zero-growth intrinsic value</li>
                  <li><strong>Growth Value:</strong> Sustainable growth premium</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">IC Simulation:</h4>
                <p>Investment Committee simulation with Buffett, Munger, and Klarman personas providing independent analysis and scoring.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Margin of Safety:</h4>
                <p>Conservative valuation approach focusing on downside protection and risk management.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>AIVI MVP - Research and Educational Tool Only</p>
            <p className="mt-1">Not Financial Advice • Use at Your Own Risk</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


