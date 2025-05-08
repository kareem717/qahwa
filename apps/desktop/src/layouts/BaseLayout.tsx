import React from "react";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="h-screen pb-20 p-2">{children}</main>
    </>
  );
}
