export function generateOGMetadata(
  framework: string,
  slug: string[],
  docMeta: { title: string; description: string; image?: string; topic?: string; subtopic?: string }
) {
  const { title, description, image, topic, subtopic } = docMeta;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://jazz.tools/docs/${[framework, ...slug].join("/")}`,
      images: [
        {
          url: `/opengraph-image?title=${encodeURIComponent(title)}&framework=${framework}${
            topic ? `&topic=${encodeURIComponent(topic)}` : ""
          }${subtopic ? `&subtopic=${encodeURIComponent(subtopic)}` : ""}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image ?? "/jazz-logo.png"],
    },
  };
}
