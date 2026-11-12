import './globals.css';
import type { Metadata } from 'next';
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FBF7F0] text-[#1C1917] selection:bg-[#D95338] selection:text-white">
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
      </body>
    </html>
  );
}
