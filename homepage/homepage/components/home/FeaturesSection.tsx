import { ServerWorkersDiagram } from "@/components/home/ServerWorkersDiagram";
import { ClerkLogo } from "@/components/icons/ClerkLogo";
import { Button } from "@garden-co/design-system/src/components/atoms/Button";
import { Card } from "@garden-co/design-system/src/components/atoms/Card";
import { H3 } from "@garden-co/design-system/src/components/atoms/Headings";
import { Icon } from "@garden-co/design-system/src/components/atoms/Icon";
import { Prose } from "@garden-co/design-system/src/components/molecules/Prose";
import { SectionHeader } from "@garden-co/design-system/src/components/molecules/SectionHeader";
import Link from "next/link";

const features = [
  {
    title: "File uploads",
    description: (
      <>
        Just use <code>{`<input type="file"/>`}</code>, and easily convert from
        and to Browser <code>Blobs</code> using a <code>BinaryCoStream</code>{" "}
        CoValue.
      </>
    ),
    illustration: (
      <div className="grid gap-6 pt-4">
        <pre className="lg:px-5">
          <code className="text-xs text-highlight lg:text-sm">
            BinaryCoStream.createFromBlob(file);
          </code>
        </pre>

        <div className="flex w-full items-center gap-4 rounded-xl border bg-white px-3 py-3 shadow-lg shadow-stone-500/10 dark:bg-stone-925">
          <Icon size="2xl" name="file" className="text-primary" />
          <div className="flex-1 text-2xl text-primary">file.pdf</div>
          <Icon size="2xl" name="delete" className="text-stone-500" />
        </div>
      </div>
    ),
  },
  {
    title: "Progressive image loading",
    description: (
      <>
        Using Jazz&apos;s <code>ImageDefinition</code> component, you get
        progressive image up & downloading, super fast blur preview, and image
        size info.
      </>
    ),
    illustration: (
      <>
        <div className="relative -mr-4 -mt-10 overflow-hidden rounded-md">
          <img
            src="/leaves.jpg"
            className="h-auto w-32 scale-125 opacity-90 blur-md"
            alt="Leaves image demonstrating progressive loading"
          />
          <p className="absolute left-0 top-0 z-10 flex h-full w-full items-center justify-center text-center text-sm text-stone-100">
            400x300
          </p>
        </div>
        <img
          src="/leaves.jpg"
          className="z-20 -ml-4 mt-10 h-auto w-32 rounded-md shadow-xl"
          alt="Leaves image demonstrating progressive loading"
        />
      </>
    ),
  },
  {
    title: "Server workers",
    description: (
      <>
        Expose an HTTP API that mutates Jazz state. Or subscribe to Jazz state
        and update existing databases or third-party APIs.
      </>
    ),
    illustration: <ServerWorkersDiagram className="w-auto pt-8" />,
  },
  {
    title: "Authentication",
    description: (
      <>
        Plug and play different kinds of auth like Passkeys (Touch ID, Face ID),
        and Clerk. Auth0, Okta, NextAuth coming soon.
      </>
    ),
    illustration: (
      <div className="flex justify-center gap-4 text-black dark:text-white">
        <Icon size="5xl" name="faceId" className="h-16 w-auto" />
        <ClerkLogo className="h-16 w-auto py-0.5" />
        <Icon size="5xl" name="touchId" className="h-16 w-auto" />
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <div>
      <SectionHeader
        title="Everything else you need to ship quickly"
        slogan={
          <>
            <p>
              We take care of the groundwork that every app needs, so you can
              focus on building the cool stuff that makes your app unique.
            </p>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:gap-8">
        {features.map(({ title, description, illustration }) => (
          <Card key={title} className="col-span-3 overflow-hidden">
            <div className="flex h-48 w-full items-center justify-center">
              {illustration}
            </div>
            <div className="p-4">
              <h3 className="mb-1 font-medium text-highlight">{title}</h3>
              <Prose size="sm">{description}</Prose>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
