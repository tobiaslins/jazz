"use client";

import { ViewsSideMenu } from "./ViewsSideMenu";

export function ViewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container gap-8 py-8 lg:py-16 relative h-full overflow-hidden flex flex-row">
      <ViewsSideMenu />
      <div className="flex-1 overflow-y-scroll mt-7">
        <h1 className="text-2xl font-semibold font-display">
          Jazz Design System
        </h1>

        {children}
      </div>
    </div>
  );
}
