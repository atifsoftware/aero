import type { Metadata } from 'next';
import './globals.css';
import { SiteShell } from '@/components/SiteShell';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Aero MVC — আধুনিক Node.js এক্সপ্রেস ফ্রেমওয়ার্ক',
    template: '%s — Aero MVC'
  },
  description: 'একটি শক্তিশালী, মডার্ন এবং অতি দ্রুতগতির Node.js এক্সপ্রেস MVC ফ্রেমওয়ার্ক।',
  keywords: [
    'Aero MVC',
    'Aero',
    'Express.js MVC',
    'Next.js 14',
    'Fast Database Engine',
    'Bengali Framework'
  ],
  authors: [{ name: 'Aero Developers' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Aero MVC Framework',
    description: 'একটি শক্তিশালী, মডার্ন এবং অতি দ্রুতগতির Node.js এক্সপ্রেস MVC ফ্রেমওয়ার্ক।',
    type: 'website',
    locale: 'bn_BD',
    siteName: 'Aero MVC',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var path = window.location.pathname || '';
                  var isAdmin = path.startsWith('/admin');
                  if (isAdmin) {
                    var savedAdmin = localStorage.getItem('admin-theme');
                    document.documentElement.setAttribute('data-theme', savedAdmin === 'dark' ? 'dark' : 'light');
                  } else {
                    var savedSite = localStorage.getItem('site-theme');
                    // Public Home page defaults to DARK mode
                    document.documentElement.setAttribute('data-theme', savedSite === 'light' ? 'light' : 'dark');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
