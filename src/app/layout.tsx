import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ValidateIQ — AI-Powered Idea Validation Engine',
  description: 'Get a data-backed, multi-source validation report for any startup idea in under 60 seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
