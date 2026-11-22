import { Marquee } from "@/components/motion/marquee";
import { CatalogSection } from "@/components/store/catalog-section";
import { DurianRecommender } from "@/components/store/durian-recommender";
import { HeroSection } from "@/components/store/hero-section";
import { TestimonialsLocation } from "@/components/store/testimonials-location";
import { WhyAgungSection } from "@/components/store/why-agung-section";
import { getActiveProducts, getStoreSettings, getVisibleTestimonials } from "@/lib/data/store";
import { isSoldOut, startingPrice } from "@/lib/pricing";
import { getSiteUrl } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, products, testimonials] = await Promise.all([
    getStoreSettings(),
    getActiveProducts(),
    getVisibleTestimonials(),
  ]);

  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Store"],
    name: settings.store_name,
    alternateName: "Durian Pak Agung",
    description: settings.hero_subheadline || settings.tagline,
    url: siteUrl,
    image: `${siteUrl}/images/og-image.jpg`,
    telephone: `+${settings.whatsapp_number}`,
    priceRange: "Rp85.000 - Rp750.000",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Karangmangu",
      addressLocality: "Kec. Sigaluh",
      addressRegion: "Kab. Banjarnegara, Jawa Tengah",
      postalCode: "53481",
      addressCountry: "ID",
    },
    openingHours: settings.opening_hours,
    sameAs: settings.instagram_handle ? [`https://instagram.com/${settings.instagram_handle}`] : [],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: settings.google_rating,
      reviewCount: settings.google_review_count,
      bestRating: 5,
      worstRating: 1,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Katalog Durian Matang Pohon AgungDurian",
      itemListElement: products.map((product) => ({
        "@type": "Offer",
        url: `${siteUrl}/produk/${product.slug}`,
        priceCurrency: "IDR",
        price: startingPrice(product),
        availability: isSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemOffered: {
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.image_url?.startsWith("/") ? `${siteUrl}${product.image_url}` : product.image_url,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <HeroSection settings={settings} products={products} />

      <div className="border-y border-orchard/10 bg-cream-2 py-3.5 text-sm font-medium text-orchard">
        <Marquee items={settings.marquee_items} />
      </div>

      <CatalogSection products={products} />
      <WhyAgungSection />
      <DurianRecommender products={products} />
      <TestimonialsLocation settings={settings} testimonials={testimonials} />
    </>
  );
}
