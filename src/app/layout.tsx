import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/AppHeader";

export const metadata = {
  title: "Reviews MVP",
  description: "QR → short link → review page",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppHeader />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
