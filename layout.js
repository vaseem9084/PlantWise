// app/layout.js
import './globals.css'

export const metadata = {
  title: 'Plant Identifier',
  description: 'Identify plants using AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-green-50 to-green-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}