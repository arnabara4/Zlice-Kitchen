import type { Metadata, Viewport } from 'next';
import { DeliveryPWAInstallPrompt } from '@/components/delivery-pwa-install-prompt';
import { NotificationSoundProvider } from '@/components/notification-sound-provider';

export const viewport: Viewport = {
  themeColor: '#0284c7',
};

export const metadata: Metadata = {
  title: 'Zlice Delivery',
  description: 'Zlice Delivery - Partner App for Food Delivery',
  manifest: '/delivery-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Zlice Delivery',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Zlice Delivery',
    title: 'Zlice Delivery',
    description: 'Manage your delivery orders efficiently',
  },
  twitter: {
    card: 'summary',
    title: 'Zlice Delivery',
    description: 'Manage your delivery orders efficiently',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <DeliveryPWAInstallPrompt />
      <NotificationSoundProvider />
      
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/delivery-sw.js', { scope: '/delivery/' }).then(
                  function(registration) {
                    console.log('[Delivery] ServiceWorker registration successful with scope:', registration.scope);
                  },
                  function(err) {
                    console.log('[Delivery] ServiceWorker registration failed:', err);
                  }
                );
              });
            }
          `,
        }}
      />
    </>
  );
}
