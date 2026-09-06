import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ECOM OS — AI Dropship Operating System',
  description: 'Autonomous Dropship Workflow Engine & Multi-Provider AI Orchestrator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#fafafa] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
