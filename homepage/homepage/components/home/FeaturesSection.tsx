import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import {
    CheckIcon,
    FileTextIcon,
    FingerprintIcon,
    ImageIcon,
    ScanFace,
    TrashIcon,
    UploadCloudIcon,
    UserIcon,
} from "lucide-react";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import Link from "next/link";
import { ClerkLogo } from "@/components/icons/ClerkLogo";

export function FeaturesSection() {
    const features = [
        {
            title: "File uploads",
            icon: UploadCloudIcon,
            description: (
                <>
                    <p>
                        Just use <code>{`<input type="file"/>`}</code>, and
                        easily convert from and to Browser <code>Blobs</code>{" "}
                        using a <code>BinaryCoStream</code> CoValue.
                    </p>
                </>
            ),
            illustration: (
                <div className="flex w-full h-full flex-col pt-4 gap-4 items-center justify-center bg-gradient-to-b from-stone-50 to-transparent">
                    <div className="grid gap-6 mx-auto">
                        <pre className="">
                            <code className="text-stone-900 dark:text-white">
                                BinaryCoStream.createFromBlob(file);
                            </code>
                        </pre>

                        <div className="w-full bg-white rounded-md py-3 px-3 flex gap-4 items-center border rounded-xl shadow-lg shadow-stone-500/10">
                            <FileTextIcon
                                size={32}
                                strokeWidth={1}
                                className="text-blue dark:text-white"
                            />
                            <div className="text-2xl flex-1 text-blue dark:text-white">
                                file.pdf
                            </div>
                            <TrashIcon
                                size={32}
                                strokeWidth={1}
                                className="text-stone-500"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: "Progressive image loading",
            icon: ImageIcon,
            description: (
                <>
                    Using Jazz&apos;s <code>ImageDefinition</code> component,
                    you get progressive image loading, super fast blur preview,
                    and image size info.
                </>
            ),
            illustration: (
                <div className="flex w-full h-full items-center justify-center bg-gradient-to-b from-stone-50 to-transparent">
                    <div className="overflow-hidden rounded-md relative -mt-10 -mr-4">
                        <img
                            src="/leaves.jpg"
                            className="w-32 h-auto blur-md scale-125 opacity-90"
                        />
                        <p className="absolute h-full w-full text-center flex items-center justify-center text-sm z-10 text-stone-100 left-0 top-0">
                            400x300
                        </p>
                    </div>
                    <img
                        src="/leaves.jpg"
                        className="z-20 w-32 shadow-xl h-auto rounded-md mt-10 -ml-4"
                    />
                </div>
            ),
        },
        {
            title: "State management",
            icon: ImageIcon,
            description: (
                <>
                    2-way data-binding. Mutate JSON directly. Reactivity is
                    built-in.
                </>
            ),
            illustration: <></>,
        },
        {
            title: "Authentication",
            icon: UserIcon,
            description: (
                <>
                    <p>
                        Plug and play different kinds of auth like WebAuthN
                        (Touch ID, Face ID), and Clerk. Auth0, Okta, NextAuth
                        coming soon.
                    </p>
                </>
            ),
            illustration: (
                <div className="flex w-full h-full items-center justify-center bg-gradient-to-b from-stone-50 to-transparent">
                    <div className="flex gap-4 justify-center text-black dark:text-white">
                        <ScanFace className="h-16 w-auto" strokeWidth={1} />
                        <ClerkLogo className="h-16 py-0.5 w-auto" />
                        <FingerprintIcon
                            className="h-16 w-auto"
                            strokeWidth={1}
                        />
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div>
            <SectionHeader
                title="Everything else you need to ship quickly"
                slogan={
                    <>
                        <p>
                            We take care of the groundwork that every app needs,
                            so you can focus on building the cool stuff that
                            makes your app unique.
                        </p>
                    </>
                }
            />

            <GappedGrid>
                {features.map(
                    ({ title, icon: Icon, description, illustration }) => (
                        <div
                            key={title}
                            className="col-span-2 border rounded-xl shadow-sm overflow-hidden"
                        >
                            <div className="w-full h-48 flex items-center">
                                {illustration}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-stone-900 dark:text-white mb-1">
                                    {title}
                                </h3>
                                <Prose size="sm">{description}</Prose>
                            </div>
                        </div>
                    ),
                )}

                <div className="border p-4 sm:p-8 bg-gradient-to-b from-stone-50 to-transparent shadow-sm rounded-xl col-span-2 md:col-span-4 space-y-5">
                    <H3>Jazz Cloud</H3>
                    <Prose className="max-w-xl">
                        <p>
                            Jazz Cloud is a real-time sync and storage
                            infrastructure that scales your Jazz app up to
                            millions of users.{" "}
                            <strong>
                                Easy setup, no configuration needed.
                            </strong>
                        </p>
                    </Prose>
                    <ul className="flex flex-col sm:flex-row gap-4 text-sm">
                        {[
                            "Blob storage",
                            "Data storage",
                            "No limits for public alpha",
                        ].map((feature) => (
                            <li
                                key={feature}
                                className="flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <span className="text-blue p-1 rounded-full bg-blue-50 dark:text-blue-500 dark:bg-white/10">
                                    <CheckIcon size={12} strokeWidth={3} />
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-center flex-wrap gap-x-5 flex-wrap gap-y-3">
                        <Button href="/cloud" variant="primary">
                            View full pricing
                        </Button>
                    </div>
                    <Prose size="sm">
                        You can rely on us, or{" "}
                        <Link href="/docs/sync-and-storage#running-your-own">
                            self-host
                        </Link>
                        .
                    </Prose>
                </div>
            </GappedGrid>
        </div>
    );
}
