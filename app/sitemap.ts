import type { MetadataRoute } from "next";
import { ogImage, siteUrl } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "es-VE": siteUrl,
        },
      },
      images: [`${siteUrl}${ogImage.url}`],
    },
  ];
}
