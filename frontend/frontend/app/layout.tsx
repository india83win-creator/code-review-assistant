import type { Metadata } from 'next'
import './globals.css'
import ToastProvider from './components/ToastProvider'

export const metadata: Metadata = {
  title: 'AI Code Review Assistant',
  description: 'Analyze, review, and understand your codebase with local and cloud AI models.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-slate-950 text-slate-100" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
