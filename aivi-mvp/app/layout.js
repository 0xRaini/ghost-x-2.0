import './globals.css'

export const metadata = {
  title: 'AIVI - Greenwald Value Investment Analysis',
  description: 'AI-powered value investment analysis using Greenwald methodology',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


