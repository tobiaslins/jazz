import fs from "fs";
import path from "path";

export const metadata = {
  title: "Upgrade guides",
  description: "How to migrate Jazz packages, and handle breaking changes.",
};

const getPaths = () => {
  const dir = path.join(process.cwd(), "components/docs/upgrades");
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.map((entry) => entry.name);
};

function UpgradeGuide({
  fileName,
  content: Content,
}: { fileName: string; content: any }) {
  const date = new Date(fileName.replace(".mdx", "")).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" },
  );
  return (
    <>
      <div className="flex gap-3 items-center">
        <h2 className="not-prose text-stone-500">
          <span className="sr-only">Package updates from</span>
          {date}
        </h2>

        <div className="h-px border-t flex-1" />
      </div>

      <div>
        <Content />
      </div>
    </>
  );
}

export default async function Page() {
  const paths = getPaths();
  const mdxSources = await Promise.all(
    paths.map(async (path) => {
      const { default: Content } = await import(
        `@/components/docs/upgrades/${path}`
      );
      return { path, Content };
    }),
  );

  return (
    <>
      <h1>Upgrade guides for Jazz packages</h1>

      <div className="space-y-12 mt-12">
        {mdxSources.map(({ path, Content }) => (
          <UpgradeGuide fileName={path} content={Content} />
        ))}
      </div>
    </>
  );
}
