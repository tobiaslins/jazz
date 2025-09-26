export function generateOGMetadata(
  framework: string,
  slug: string[],
  docMeta: { title: string; description: string; image?: string }
) {
  return {
    title: docMeta.title,
    description: docMeta.description,
    openGraph: {
      title: docMeta.title,
      description: docMeta.description,
      type: "article",
      url: `https://jazz.tools/docs/${[framework, ...slug].join("/")}`,
      images: [
        {
          url: docMeta.image ?? "/jazz-logo.png", 
          width: 1200,
          height: 630,
          alt: docMeta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: docMeta.title,
      description: docMeta.description,
      images: [docMeta.image ?? "/jazz-logo.png"], 
    },
  };
}
