export default function LoadingSpinner() {
  return (
    <div className="card">
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analyzing Company</h3>
            <p className="text-sm text-gray-600">
              Running Greenwald valuation analysis and IC simulation...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


