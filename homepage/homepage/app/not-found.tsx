"use client";
import { SideNavLayout } from "@/components/SideNavLayout";
import { HelpLinks } from "@/components/docs/HelpLinks";
import { JazzMobileNav } from "@/components/nav";
import { DocProse } from "@/lib/docMdxContent";
import { Icon404 } from "@garden-co/design-system/src/components/atoms/icons/404";
import { usePathname } from "next/navigation";
import { JazzNav } from "@/components/nav";


export default function NotFound() {
  const text = "Don't Worry 'Bout Me";
  const path = usePathname();

  return (
    <>
      <div className="w-full">
        <JazzNav />
        <DocProse>
          <h1>Couldn't find that page</h1>
          <Icon404 className="w-[30%]" />
        </DocProse>
      </div>

      <div className="pl-3 py-8 shrink-0 text-sm sticky align-start top-[61px] w-[16rem] h-[calc(100vh-61px)] overflow-y-auto hidden lg:block">
        <HelpLinks />

      </div>
      <JazzMobileNav />
    </>
  );
}
