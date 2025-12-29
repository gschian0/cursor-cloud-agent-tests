import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "AI Calendar - Smart Calendar & CRM",
  description: "Modern calendar application with integrated CRM, email notifications, and AI-powered scheduling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('color-theme') || 'light';
                  const root = document.documentElement;
                  if (theme === 'dark') {
                    root.style.setProperty('--primary-color', '#60a5fa');
                    root.style.setProperty('--secondary-color', '#a78bfa');
                    root.style.setProperty('--background-color', '#0f172a');
                    root.style.setProperty('--surface-color', '#1e293b');
                    root.style.setProperty('--text-primary', '#f1f5f9');
                    root.style.setProperty('--text-secondary', '#cbd5e1');
                    root.style.setProperty('--border-color', '#334155');
                    root.style.setProperty('--header-bg', '#1e293b');
                    root.style.setProperty('--header-text', '#f1f5f9');
                    root.style.setProperty('--calendar-bg', '#1e293b');
                    root.style.setProperty('--event-default-color', '#60a5fa');
                    root.style.setProperty('--gradient-start', '#1e293b');
                    root.style.setProperty('--gradient-end', '#0f172a');
                    root.style.setProperty('--text-size-base', '16px');
                    root.style.setProperty('--text-size-sm', '14px');
                    root.style.setProperty('--text-size-lg', '18px');
                    root.style.setProperty('--text-size-xl', '20px');
                    root.style.setProperty('--text-size-2xl', '24px');
                    root.style.setProperty('--text-size-3xl', '30px');
                    root.style.setProperty('--text-weight-normal', '400');
                    root.style.setProperty('--text-weight-medium', '500');
                    root.style.setProperty('--text-weight-semibold', '600');
                    root.style.setProperty('--text-weight-bold', '700');
                    root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.5)');
                  } else {
                    root.style.setProperty('--primary-color', '#3b82f6');
                    root.style.setProperty('--secondary-color', '#8b5cf6');
                    root.style.setProperty('--background-color', '#ffffff');
                    root.style.setProperty('--surface-color', '#f9fafb');
                    root.style.setProperty('--text-primary', '#111827');
                    root.style.setProperty('--text-secondary', '#6b7280');
                    root.style.setProperty('--border-color', '#e5e7eb');
                    root.style.setProperty('--header-bg', '#ffffff');
                    root.style.setProperty('--header-text', '#111827');
                    root.style.setProperty('--calendar-bg', '#ffffff');
                    root.style.setProperty('--event-default-color', '#3b82f6');
                    root.style.setProperty('--gradient-start', '#eff6ff');
                    root.style.setProperty('--gradient-end', '#dbeafe');
                    root.style.setProperty('--text-size-base', '16px');
                    root.style.setProperty('--text-size-sm', '14px');
                    root.style.setProperty('--text-size-lg', '18px');
                    root.style.setProperty('--text-size-xl', '20px');
                    root.style.setProperty('--text-size-2xl', '24px');
                    root.style.setProperty('--text-size-3xl', '30px');
                    root.style.setProperty('--text-weight-normal', '400');
                    root.style.setProperty('--text-weight-medium', '500');
                    root.style.setProperty('--text-weight-semibold', '600');
                    root.style.setProperty('--text-weight-bold', '700');
                    root.style.setProperty('--text-3d-color', 'rgba(0, 0, 0, 0.3)');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
