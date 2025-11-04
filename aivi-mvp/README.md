# AIVI MVP - Greenwald Value Investment Analysis

A simplified MVP implementation of the AIVI (AI Value Investment) system using Greenwald's three-step valuation methodology.

## Features

- **Company Analysis**: Input ticker symbol to get financial analysis
- **Greenwald Valuation**: 
  - Reproduction Cost calculation
  - EPV (Earnings Power Value) calculation
  - Margin of Safety analysis
- **IC Simulation**: Investment Committee simulation with Buffett, Munger, and Klarman personas
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Try analyzing companies like AAPL or MSFT

## Demo Data

The MVP uses mock financial data for demonstration:
- **AAPL**: Apple Inc.
- **MSFT**: Microsoft Corporation

## Architecture

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Data**: Mock financial data (simplified for MVP)
- **Valuation**: JavaScript-based Greenwald methodology
- **IC Simulation**: Stylized personas with scoring logic

## Methodology

### Greenwald Three-Step Valuation

1. **Reproduction Cost**: Asset-based valuation including tangible assets and working capital
2. **EPV**: Zero-growth intrinsic value based on normalized earnings power
3. **Growth Value**: Sustainable growth premium (simplified in MVP)

### IC Simulation

- **Warren Buffett**: Focus on moats and long-term value
- **Charlie Munger**: Emphasis on quality and mental models  
- **Seth Klarman**: Deep value and margin of safety focus

## Limitations (MVP)

- Uses mock data instead of real-time financial data
- Simplified valuation calculations
- Limited to 2 demo companies
- No persistent storage
- Basic IC simulation logic

## Future Enhancements

- Real-time financial data integration
- More sophisticated valuation models
- Additional IC personas
- Historical analysis
- Portfolio tracking
- Export functionality

## Disclaimer

This is a research and educational tool only. Not financial advice. Use at your own risk.

## License

MIT License


