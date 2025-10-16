"use client";
import { HelpLinks } from "@/components/docs/HelpLinks";
import { JazzMobileNav } from "@/components/nav";
import { Heading } from "@/components/docs/DocHeading";
import { usePathname } from "next/navigation";
import { JazzNav } from "@/components/nav";
import { SearchBoxWithResults } from '@/components/SearchBoxWithResults';
import { DocProse } from "@/lib/docMdxContent";

export default function NotFound() {
  const path = usePathname();

  return (
    <>
      <div className="w-full">
        <JazzNav />
        <DocProse>
          <div className="p-2">
            <Heading tag="h1">Page Not Found</Heading>
            <p>
              Either the link you followed is broken or the content has moved.
            </p>
            <p>Were you looking for...</p>
            <SearchBoxWithResults searchTerms={path.replace('/docs', '').split('/').join(' ').trim()} />
          </div>
        </DocProse>
      </div>

      <div className="pl-3 py-8 shrink-0 text-sm sticky align-start top-[61px] w-[16rem] h-[calc(100vh-61px)] overflow-y-auto hidden lg:block">
        <HelpLinks />

      </div>
      <JazzMobileNav />
    </>
  );
}
