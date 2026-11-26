import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TasteMeter } from "@/components/motion/taste-meter";
import { DualModeConfigurator } from "@/components/store/dual-mode-configurator";
import { ProductImage } from "@/components/store/product-image";
import { getCategoryLabel } from "@/lib/constants";
import { getActiveCustomOptions, getActiveProducts, getProductBySlug, getStoreSettings } from "@/lib/data/store";
import { isSoldOut, startingPrice } from "@/lib/pricing";
import { formatRupiah, getSiteUrl } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);
  if (!product) {
    return { title: "Produk tidak ditemukan" };
  }

  const siteUrl = getSiteUrl();
  const image = product.image_url?.startsWith("/") ? `${siteUrl}${product.image_url}` : (product.image_url ?? `${siteUrl}/images/og-image.jpg`);

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${settings.store_name}`,
      description: product.description,
      url: `/produk/${product.slug}`,
      images: [{ url: image, alt: product.name }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings, allProducts, customOptions] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
    getActiveProducts(),
    getActiveCustomOptions(),
  ]);

  if (!product) notFound();
  const categories = customOptions.filter((o) => o.option_type === "category");

  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 3);
  const siteUrl = getSiteUrl();
  const soldOut = isSoldOut(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image_url?.startsWith("/") ? `${siteUrl}${product.image_url}` : product.image_url,
    brand: { "@type": "Brand", name: settings.store_name },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produk/${product.slug}`,
      priceCurrency: "IDR",
      price: startingPrice(product),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-xs text-moss">
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-orchard hover:underline">
            <ArrowLeft className="size-3.5" />
            Beranda
          </Link>
          <span>/</span>
          <Link href="/#katalog" className="hover:text-orchard">
            Katalog
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-bark">{product.name}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-orchard/10 bg-orchard shadow-lift">
              <ProductImage
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 95vw, 48vw"
              />
              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-orchard/85 px-3 py-1 text-xs font-semibold text-cream backdrop-blur">
                  {getCategoryLabel(product.variety_category, categories)}
                </span>
                {product.badge ? (
                  <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-orchard shadow-soft">
                    {product.badge}
                  </span>
                ) : null}
              </div>
            </div>

            {product.origin_notes ? (
              <div className="rounded-3xl border border-orchard/10 bg-cream-2/70 p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orchard">
                  <MapPin className="size-4 text-gold-hover" />
                  Catatan Kebun &amp; Asal Panen
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-bark/85">{product.origin_notes}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 lg:col-span-6">
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-bold leading-tight text-orchard sm:text-4xl">
                {product.name}
              </h1>
              <p className="text-base leading-relaxed text-moss">{product.description}</p>
            </div>

            <div className="rounded-3xl border border-orchard/10 bg-white/85 p-5 shadow-soft sm:p-6">
              <DualModeConfigurator
                product={product}
                variant="full"
                customOptions={customOptions}
                gramPresets={settings.gram_presets_json}
              />
            </div>

            <div className="rounded-3xl border border-orchard/10 bg-cream-2/60 p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-orchard">
                Profil Karakter Rasa (Skala 1–5)
              </p>
              <TasteMeter
                profile={{
                  sweet: product.taste_sweet,
                  creamy: product.taste_creamy,
                  bitter: product.taste_bitter,
                  thickness: product.taste_thickness,
                }}
              />
            </div>

            <div className="rounded-3xl bg-orchard p-6 text-cream">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-6 shrink-0 text-gold" />
                <div className="space-y-2">
                  <p className="font-display text-lg font-semibold text-cream">
                    Garansi Matang Pohon {settings.store_name}
                  </p>
                  <ul className="space-y-1.5 text-xs text-cream/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-gold" />
                      Ganti baru atau refund jika buah terbukti hambar atau mentah.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 shrink-0 text-gold" />
                      Timbangan digital terbuka &amp; transparan sebelum serah terima.
                    </li>
                  </ul>
                  <a
                    href={buildWhatsAppUrl(
                      settings.whatsapp_number,
                      `Halo ${settings.store_name}, saya mau tanya stok & pilihan ukuran ${product.name}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-gold hover:underline"
                  >
                    Konsultasi langsung dengan Pak Agung <ArrowRight className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-20 border-t border-orchard/10 pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-hover">Varietas Lain</p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-orchard">
                  Koleksi lain dari kebun Sigaluh
                </h2>
              </div>
              <Link href="/#katalog" className="text-xs font-semibold text-orchard hover:underline">
                Lihat semua →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/produk/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-orchard/10 bg-white/80 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[16/10] bg-orchard">
                    <ProductImage
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 30vw"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="font-display text-lg font-bold text-orchard group-hover:text-gold-hover">
                      {item.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-moss">{item.description}</p>
                    <p className="mt-3 font-mono text-sm font-bold text-orchard tabular">
                      Mulai {formatRupiah(startingPrice(item))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
