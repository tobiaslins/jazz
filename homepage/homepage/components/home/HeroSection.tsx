"use client";

import { marketingCopy } from "@/content/marketingCopy";
import { H1 } from "@garden-co/design-system/src/components/atoms/Headings";
import { Kicker } from "@garden-co/design-system/src/components/atoms/Kicker";
import { Prose } from "@garden-co/design-system/src/components/molecules/Prose";
import Link from "next/link";
import { CodeTabs } from "@/components/home/CodeTabs";
import { JazzSyncs } from "@/components/icons/JazzSyncs";
import NpxCreateJazzApp from "@/components/home/NpxCreateJazzApp.mdx";
import { Button } from "@garden-co/design-system/src/components/atoms/Button";
import { CopyButton } from "@garden-co/design-system/src/components/molecules/CodeGroup";
import clsx from "clsx";
import { track } from "@vercel/analytics";

export function HeroSection() {
  return (
    <section className="container grid min-h-[80vh] items-start py-12 md:grid-cols-12 md:py-24">
      <div className="md:col-span-5">
        <Kicker className="mb-6">Ship Better Apps, Faster.</Kicker>
        <H1>
          <JazzSyncs className="max-w-full" />
          <span className="sr-only">{marketingCopy.headline}</span>
        </H1>
        <Prose size="lg" className="mt-6 prose-p:leading-normal">
          <p>
            A new kind of distributed database that runs across your frontend,
            containers, serverless functions and its own cloud.
          </p>
          <p>
            It syncs data, files and LLM streams instantly and feels like
            reactive local JSON state.
          </p>
          <p>
            Built-in auth, orgs, multiplayer, edit history, permissions,
            encryption, offline support and more.
          </p>

          <p className="text-base">
            Self-host or use{" "}
            <Link className="text-reset" href="/cloud">
              Jazz Cloud
            </Link>{" "}
            Open source (MIT)
          </p>
        </Prose>

        <div className="mt-8 flex gap-4">
          <div className="relative col-span-2 w-full flex-1 overflow-hidden rounded-lg border-2 border-primary text-sm md:text-base lg:col-span-3">
            <NpxCreateJazzApp />
            <CopyButton
              code="npx create-jazz-app@latest"
              size="sm"
              className={clsx(
                "z-100 mr-0.5 mt-0.5 hidden md:block md:opacity-100",
              )}
              onCopy={() => track("create-jazz-app command copied from hero")}
            />
          </div>
          <Button intent="primary" size="lg" href={`/docs/`}>
            Read the docs
          </Button>
        </div>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <CodeTabs className="mt-12" />
      </div>
    </section>
  );
}
