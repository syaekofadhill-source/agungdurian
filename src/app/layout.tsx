import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { getStoreSettings } from "@/lib/data/store";
import { getSiteUrl } from "@/lib/utils";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStoreSettings();
  const title = `${s.store_name} — Durian Matang Pohon Sigaluh, Banjarnegara`;
  const description =
    "Durian Pak Agung: durian matang pohon langsung dari kebun Karangmangu, Sigaluh, Banjarnegara. Beli per butir utuh atau per gram daging kupas — garansi manis, timbangan jujur, kirim vacuum ke luar kota.";
  const ogImage = s.og_image_url || "/images/og-image.jpg";
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s · ${s.store_name}` },
    description,
    applicationName: s.store_name,
    keywords: [
      "durian banjarnegara",
      "durian sigaluh",
      "durian pak agung",
      "durian bawor",
      "musang king jawa tengah",
      "durian kupas",
      "durian matang pohon",
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/",
      siteName: s.store_name,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Durian matang pohon ${s.store_name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0D2419",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
