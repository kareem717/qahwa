import { Outlet, createFileRoute } from "@tanstack/react-router";
import { NavBack } from "@qahwa/landing/components/nav-back";
import { MDXProvider } from "@mdx-js/react";

export const Route = createFileRoute("/_legal")({
  component: LegalLayout,
});

export function LegalLayout() {
  // ^-- Assumes an integration is used to compile MDX to JS, such as
  // `@mdx-js/esbuild`, `@mdx-js/loader`, `@mdx-js/node-loader`, or
  // `@mdx-js/rollup`, and that it is configured with
  // `options.providerImportSource: '@mdx-js/react'`.
  const components = {
    em: (props) => <i {...props} />,
  };

  return (
    <MDXProvider components={components}>
      <div className="container mx-auto relative w-screen h-screen">
        <NavBack className="fixed top-0 left-0" />
        <div className="p-4 mt-10">
          <Outlet />
        </div>
      </div>
    </MDXProvider>
  );
}
