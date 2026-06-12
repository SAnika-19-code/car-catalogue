import type { Metadata } from "next";
import "./globals.css";

const siteName = "Varsha Cushions";
const description =
  "Browse premium car seat covers, roof designs, steering covers, and floor lamination from Varsha Cushions.";

export const metadata: Metadata = {
  title: {
    default: `${siteName} | Premium Car Accessories Catalogue`,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    "car seat covers",
    "roof designs",
    "steering covers",
    "floor lamination",
    "car accessories",
    "Varsha Cushions",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName,
    title: `${siteName} | Premium Car Accessories Catalogue`,
    description,
  },
  twitter: {
    card: "summary",
    title: `${siteName} | Premium Car Accessories Catalogue`,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
