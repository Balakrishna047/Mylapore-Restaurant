import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import ChatWidget from '@/components/ChatWidget';
import LocationModal from '@/components/LocationModal';

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
              <ChatWidget />
              <LocationModal />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
