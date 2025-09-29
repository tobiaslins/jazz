import { DocPage, generateOGMetadata, getDocMetadata } from "@/lib/docMdxContent";
import fs from "fs";
import path from "path";
import { frameworks } from "@/content/framework";

type Params = {
  framework: string;
  slug?: string[];
};

type Frontmatter = {
  title: string;
  description: string;
  image?: string;
  topic?: string;
  subtopic?: string;
};

type DocMeta = {
  fm: Frontmatter;
  ex?: any;
};

export async function generateMetadata({ params }: { params: Params }) {
    const awaitedParams = await params; 
  const framework = awaitedParams.framework;
  const slug = awaitedParams.slug ?? [];

  const docMeta = await getDocMetadata(framework, slug);
//   console.log("Doc metadata for OG:", docMeta);

  // Pass only the frontmatter to generateOGMetadata
  return generateOGMetadata(framework, slug, docMeta.fm);
}

export default async function Page({ params }: { params: Params }) {
    const awaitedParams = await params; 
  const framework = awaitedParams.framework;
  const slug = awaitedParams.slug ?? [];

  const docMeta = await getDocMetadata(framework, slug);

  // Optional fallback
  if (!docMeta?.fm) {
    return <p>Documentation not found for {framework}/{slug.join("/")}</p>;
  }

  // Only pass what DocPage expects (framework + slug)
  return <DocPage framework={framework} slug={slug} />;
}


// --- Static Params for SSG ---
function getAllDocPaths(): Params[] {
  const allPaths: Params[] = [];

  frameworks.forEach((framework) => {
    const frameworkDir = path.join(process.cwd(), "content/docs", framework);

    function walk(dir: string, slug: string[] = []) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), [...slug, entry.name]);
        } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
          const nameWithoutExt = entry.name.replace(/\.mdx$/, "");
          allPaths.push({ framework, slug: [...slug, nameWithoutExt] });
        }
      });
    }

    if (fs.existsSync(frameworkDir)) {
      walk(frameworkDir);
    }
  });

  return allPaths;
}

export async function generateStaticParams() {
  return getAllDocPaths();
}

export const dynamicParams = false;
export const dynamic = "force-static";
