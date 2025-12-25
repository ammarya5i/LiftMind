import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "LiftMind - Your AI Gym Coach",
  description: "Your AI-powered fitness coach. Track workouts, get personalized programs, form analysis, and real-time feedback for all training styles.",
  openGraph: {
    title: "LiftMind - Your AI Gym Coach",
    description: "Your AI-powered fitness coach. Track workouts, get personalized programs, form analysis, and real-time feedback for all training styles.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://liftmind.netlify.app",
    siteName: "LiftMind",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiftMind - Your AI Gym Coach",
    description: "Your AI-powered fitness coach. Track workouts, get personalized programs, form analysis, and real-time feedback for all training styles.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://liftmind.netlify.app"),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="font-sans bg-dark-950" suppressHydrationWarning>
        <ErrorBoundary>
        <div className="relative min-h-screen">
          {/* Animated background mesh */}
          <div className="fixed inset-0 bg-mesh-dark opacity-50 pointer-events-none" />
          
          {/* Grid pattern overlay */}
          <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
          
          {/* Main content */}
          <div className="relative flex flex-col md:flex-row min-h-screen">
            <Navigation />
            <main className="flex-1 md:ml-64 pb-20 md:pb-0">
              {children}
            </main>
          </div>
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
        </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}
