"use client";

import { marketingCopy } from "@/content/marketingCopy";
import { H1 } from "@garden-co/design-system/src/components/atoms/Headings";
import {
  Icon,
  type IconName,
} from "@garden-co/design-system/src/components/atoms/Icon";
import { Kicker } from "@garden-co/design-system/src/components/atoms/Kicker";
import { Prose } from "@garden-co/design-system/src/components/molecules/Prose";
import Link from "next/link";
import { GetStartedSnippetSelect } from "./GetStartedSnippetSelect";


const features: Array<{
  title: string;
  icon: IconName;
}> = [
    {
      title: "Instant updates",
      icon: "instant",
    },
    {
      title: "Real-time sync",
      icon: "devices",
    },
    {
      title: "Multiplayer",
      icon: "spatialPresence",
    },
    {
      title: "File uploads",
      icon: "upload",
    },
    {
      title: "Social features",
      icon: "social",
    },
    {
      title: "Permissions",
      icon: "permissions",
    },
    {
      title: "E2E encryption",
      icon: "encryption",
    },
    {
      title: "Authentication",
      icon: "auth",
    },
  ];

export function HeroSection() {
  return (
    <div className="container grid items-center gap-x-8 gap-y-12 mt-12 md:mt-16 lg:mt-24 mb-12 lg:gap-x-10 lg:grid-cols-12">
      <div className="flex flex-col justify-center gap-5 lg:col-span-11 lg:gap-8">
        <Kicker>Reactive, distributed, secure</Kicker>
        <H1>
          <span className="inline-block text-highlight">
            {marketingCopy.headline}
          </span>
        </H1>

        <Prose size="lg" className="text-pretty max-w-2xl dark:text-stone-200 prose-p:leading-normal">
          <p>
            Jazz is a new kind of database that's distributed across your frontend, containers, serverless functions and its own storage cloud.
          </p>
          <p>It syncs structured data, files and LLM streams instantly.<br/>It looks like local reactive JSON state.</p>
          <p>And you get auth, orgs & teams, real-time multiplayer, edit histories, permissions, E2E encryption and offline-support out of the box.</p>
          <p>
            This lets you get rid of 90% of the traditional backend, and most of your frontend state juggling.
            You&apos;ll ship better apps, faster.
          </p>
          <p className="text-base">
            Self-host or use{" "}
            <Link className="text-reset" href="/cloud">
              Jazz Cloud
            </Link>{" "}
            for a zero-deploy globally-scaled DB.
            <br/>Open source (MIT)
          </p>
        </Prose>
      </div>
    </div>
  );
}
