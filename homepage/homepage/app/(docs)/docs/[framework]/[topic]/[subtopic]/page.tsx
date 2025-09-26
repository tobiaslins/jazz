import { DocPage, generateOGMetadata, getDocMetadata } from "@/lib/docMdxContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ framework: string; topic: string; subtopic: string }>;
}) {
  const { framework, topic, subtopic } = await params;
  const docMeta = getDocMetadata(framework, [topic, subtopic]);
  return generateOGMetadata(framework, [topic, subtopic], docMeta);
}

export default async function Page({
  params,
}: {
  params: Promise<{ framework: string; topic: string; subtopic: string }>;
}) {
  const { framework, topic, subtopic } = await params;
  return <DocPage framework={framework} slug={[topic, subtopic]} />;
}
