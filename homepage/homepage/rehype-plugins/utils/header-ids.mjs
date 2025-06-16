import GithubSlugger from 'github-slugger';

const slugs = new GithubSlugger();
const FRAMEWORK_PATTERN = /\s*\[\!framework=([a-zA-Z0-9,_-]+)\]\s*$/;

export function extractFrameworkMarkers(text) {
  const match = text.match(FRAMEWORK_PATTERN);
  if (!match) return { text, frameworks: null };
  
  return {
    text: text.replace(FRAMEWORK_PATTERN, ''),
    frameworks: match[1].split(',')
  };
}

/**
 * Generates a URL-friendly ID for a header, handling:
 * - Code blocks (text within backticks)
 * - Framework visibility markers ([!framework=...])
 * - Special characters and spaces
 */
export function generateHeaderId(headerText) {
  slugs.reset();
  
  // Remove framework visibility markers
  const { text } = extractFrameworkMarkers(headerText);
  
  // Generate the slug
  return slugs.slug(text);
}
