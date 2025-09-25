import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { AppHeader } from "@/components/AppHeader";
import HideOnLanding from "@/components/HideOnLanding";

export const metadata = {
  title: "JRT PRODUCTS",
  description: "Amazon Reviews Collection Tool",
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
            {/* Header (incl. theme toggle) is hidden on /r/[slug] */}
            <HideOnLanding>
              <AppHeader />
            </HideOnLanding>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
