import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'NodeFlow — Enterprise Full-Stack MVC & Next.js 14 Platform',
    template: '%s | NodeFlow'
  },
  description: 'Enterprise-grade ERP and Business Management platform powered by Node.js Express 4 MVC, Next.js 14 App Router with SSR, and React Native Expo.',
  keywords: [
    'NodeFlow',
    'ERP Framework',
    'Express.js MVC',
    'Next.js 14',
    'App Router',
    'SSR',
    'React Server Components',
    'Fluent Query Builder',
    'Redis Cache',
    'Gemini AI',
    'SEO Optimized'
  ],
  authors: [{ name: 'NodeFlow Core Team' }],
  creator: 'NodeFlow Developers',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'NodeFlow — Enterprise Full-Stack Platform',
    description: 'High-performance Node.js Express 4 MVC & Next.js 14 enterprise ERP platform with SSR.',
    type: 'website',
    locale: 'bn_BD',
    siteName: 'NodeFlow Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NodeFlow Enterprise Platform',
    description: 'Next.js 14 App Router SSR + Express 4 MVC Core Engine.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
