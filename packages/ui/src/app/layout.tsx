import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AE AI Extension',
  description: 'After Effects AI-powered character animation tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-ae-dark text-ae-text">
        <div className="flex flex-col min-h-screen">
          <header className="bg-ae-darker border-b border-ae-border px-6 py-4">
            <h1 className="text-xl font-bold text-ae-accent">AE AI Extension</h1>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
