// mdx.d.ts
declare module "*.mdx" {
  let MDXComponent: (props: unknown) => JSX.Element;
  export default MDXComponent;
  export const frontmatter: Record<string, unknown>; // Or a more specific type for your frontmatter
  // Add any other exports you expect from your MDX files, like tableOfContents
  // export const tableOfContents: Array<{ level: number; title: string; slug: string }>;
}
