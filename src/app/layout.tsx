import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import LoadingScreen from '@/components/ui/LoadingScreen';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A192F',
};

export const metadata: Metadata = {
  title: 'Bitácora Electrónica | Proyecto: Conexion VAS - Hincapie',
  description: 'Sistema de control y consulta de bitácoras de obra en formato PDF con Supabase Storage.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${poppins.variable} font-poppins`}>
      <body className={`${poppins.className} min-h-screen bg-[#F3F4F7] text-[#07152B] antialiased`}>
        <Providers>
          <LoadingScreen />
          {children}
        </Providers>
      </body>
    </html>
  );
}
