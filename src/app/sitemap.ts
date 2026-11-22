import type { MetadataRoute } from "next";

import { getActiveProducts } from "@/lib/data/store";
import { getSiteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const products = await getActiveProducts();

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...products.map((product) => ({
      url: `${siteUrl}/produk/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
