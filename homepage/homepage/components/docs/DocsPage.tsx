import React from "react";

export type DocPageProps = {
  framework: string;
  slug?: string[];
  frontmatter: {
    title: string;
    description: string;
    image?: string;
    topic?: string;
    subtopic?: string;
  };
  examples?: any;
};

export function DocPage({ framework, slug, frontmatter, examples }: DocPageProps) {
  return (
    <div>
      <h1>{frontmatter.title}</h1>
      <p>{frontmatter.description}</p>
      {frontmatter.image && <img src={frontmatter.image} alt={frontmatter.title} />}
    </div>
  );
}
