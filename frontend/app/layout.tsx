import type { Metadata } from "next";
import { AmplifyProvider } from "@/components/amplify-provider";
import { SiteHeader } from "@/components/site-header";
import { getSessionClaims } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "研修ポータル",
  description: "研修ポータル",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const claims = await getSessionClaims();

  return (
    <html lang="ja">
      <body className="min-h-screen bg-muted/40 antialiased">
        <AmplifyProvider>
          <SiteHeader user={claims ? { email: claims.email, isAdmin: claims.isAdmin } : null} />
          <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        </AmplifyProvider>
      </body>
    </html>
  );
}
