import React from "react"
import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/auth/auth-provider'
import './globals.css'

const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-sans' });
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Learnza | AP Exam Prep',
  description: 'Ace your AP exams with intelligent practice sessions, detailed analytics, and performance tracking built for serious AP students.',
  keywords: ['AP exams', 'AP prep', 'AP Biology', 'AP Chemistry', 'AP World History', 'AP European History', 'AP Precalculus', 'AP Macroeconomics', 'AP practice', 'college board'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
