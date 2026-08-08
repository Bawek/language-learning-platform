import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'LinguaAI — Master Any Language with AI',
    template: '%s | LinguaAI',
  },
  description:
    'Practice languages in real time with AI tutors using voice, text, and video conversations. Personalized feedback and adaptive difficulty.',
  keywords: ['language learning', 'AI tutor', 'conversation practice', 'speech recognition'],
  authors: [{ name: 'LinguaAI' }],
  openGraph: {
    title: 'LinguaAI — Master Any Language with AI',
    description: 'Real-time AI-powered language learning with voice, text, and video.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
