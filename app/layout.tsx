import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { ThemeProvider } from '@/components/theme-provider'
import { CanteenProvider } from '@/lib/canteen-context'
import { AuthProvider } from '@/lib/auth-context'
import { DynamicManifest } from '@/components/dynamic-manifest'
import { QueryProvider } from '@/components/query-provider'
import LayoutContent from './layout-content'
import { NotificationSoundProvider } from '@/components/notification-sound-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Kitchen App',
  description: 'College Kitchen Management & Order System',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kitchen App',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Kitchen App',
    title: 'Kitchen App',
    description: 'College Kitchen Management & Order System',
  },
  twitter: {
    card: 'summary',
    title: 'Kitchen App',
    description: 'College Kitchen Management & Order System',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Kitchen App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kitchen App" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning={true}>
        <DynamicManifest />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <CanteenProvider>
                <LayoutContent>{children}</LayoutContent>
                <PWAInstallPrompt />
                <Toaster 
                  position="top-right" 
                  richColors 
                  closeButton
                  toastOptions={{
                    style: {
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    },
                  }}
                />
              </CanteenProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <NotificationSoundProvider />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                // Prevent Canteen SW from registering on Delivery pages
                if (window.location.pathname.startsWith('/delivery')) {
                    console.log('Skipping Main SW registration on Delivery App');
                    return;
                }
                
                navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(
                  function(registration) {
                    console.log('ServiceWorker registration successful with scope:', registration.scope);
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed:', err);
                  }
                );
              });
            }

            // Listen for install prompt
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('beforeinstallprompt event fired');
              e.preventDefault();
              window.deferredPrompt = e;
            });
          `
        }} />
      </body>
    </html>
  )
}
