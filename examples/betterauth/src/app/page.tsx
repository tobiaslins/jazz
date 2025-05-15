"use client";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { useAccount } from "jazz-react";
import {
  AppWindowMacIcon,
  FileTextIcon,
  GlobeIcon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { me } = useAccount({ resolve: { profile: {} } });

  if (!me) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <Image
            src="/jazz-logo.svg"
            alt="Jazz logo"
            width={180}
            height={38}
            priority
          />
          <p className="text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            Signed in as{" "}
            <span className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              {me.profile.name}
            </span>{" "}
            with id{" "}
            <span className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              {me.id}
            </span>
          </p>

          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Button asChild size="lg">
              <a
                href="https://jazz.tools/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/jazz.svg" alt="" width={20} height={20} />
                Start building
              </a>
            </Button>

            <Button asChild variant="secondary" size="lg">
              <a
                href="https://jazz.tools/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileTextIcon className="size-4" />
                Read the docs
              </a>
            </Button>
          </div>
        </main>

        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
          <Button asChild variant="ghost">
            <a
              href="https://jazz.tools/api-reference"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileTextIcon className="size-4" />
              API reference
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a
              href="https://jazz.tools/examples"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AppWindowMacIcon className="size-4" />
              Examples
            </a>
          </Button>

          <Button asChild variant="ghost">
            <a
              href="https://jazz.tools/status"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GlobeIcon className="size-4" />
              Status
            </a>
          </Button>

          <Button asChild variant="ghost">
            <a
              href="https://jazz.tools/showcase"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WrenchIcon className="size-4" />
              Built with Jazz
            </a>
          </Button>
        </footer>
      </div>
    </>
  );
}
