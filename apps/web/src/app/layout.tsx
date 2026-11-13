import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import MobileCartBar from '@/components/MobileCartBar';
import LocationModal from '@/components/LocationModal';
import SalesforceChatEmbed from '@/components/SalesforceChatEmbed';

export const metadata: Metadata = {
  title: 'Mylapore Express | Authentic Fresh South Indian Culinary E-Commerce',
  description: 'Fresh from Mylapore, delivered with care. Blast-chilled preservative-free South Indian delicacies, dosas, curries, and batters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        {/* Preload the Hero Carousel LCP image for instantaneous visual paint */}
        <link
          rel="preload"
          as="image"
          href="https://res.cloudinary.com/dwlh5wdsw/image/upload/f_auto,q_auto,w_1000/v1794550079/mylapore-express/banners/banner-freshly-cooked-dosa-idli-breakfast.jpg"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200 selection:bg-primary selection:text-white">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <LocationProvider>
                <CartProvider>
                  <Header />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <CartDrawer />
                  <MobileCartBar />
                  <LocationModal />

                  {/* Official Salesforce Agentforce Embedded Messaging (MIAW) Live Deployment */}
                  <SalesforceChatEmbed />
                </CartProvider>
              </LocationProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
