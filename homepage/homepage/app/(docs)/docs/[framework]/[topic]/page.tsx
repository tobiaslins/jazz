import { DocPage, getDocMetadata } from "@/lib/docMdxContent";
import { generateOGMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ framework: string; topic: string }>;
}) {
  const { framework, topic } = await params;
  const docMeta = getDocMetadata(framework, [topic]);
  return generateOGMetadata(framework, [topic], docMeta);
}

export default async function Page({
  params,
}: {
  params: Promise<{ framework: string; topic: string }>;
}) {
  const { framework, topic } = await params;
  return <DocPage framework={framework} slug={[topic]} />;
}
