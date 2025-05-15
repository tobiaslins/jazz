"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useIsAuthenticated } from "jazz-react";
import { useAuth } from "jazz-react-auth-betterauth";
import {
  AppWindowMacIcon,
  FileTextIcon,
  GlobeIcon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

export default function Home() {
  const { authClient, account, state } = useAuth();
  const hasCredentials = state !== "anonymous";
  const { me, logOut } = useAccount({ resolve: { profile: {} } });
  const isAuthenticated = useIsAuthenticated();
  const signOut = useCallback(() => {
    authClient.signOut().catch(console.error).finally(logOut);
  }, [logOut, authClient]);
  console.log("me", me);
  console.log("account", account);
  console.log("state", state);
  console.log("hasCredentials", hasCredentials);
  console.log("isAuthenticated", isAuthenticated);

  return (
    <>
      <header className="absolute p-4 top-0 left-0 w-full z-10 flex items-center justify-between gap-4">
        <div className="float-start flex gap-4">
          {me && hasCredentials && isAuthenticated && (
            <>
              <Button onClick={signOut}>Sign out</Button>
              <Button asChild>
                <Link href="/settings">Settings</Link>
              </Button>
            </>
          )}
        </div>
        <div className="float-end flex gap-4">
          {!hasCredentials && !isAuthenticated && (
            <>
              <Button asChild variant="secondary">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <Image
            src="/jazz-logo.svg"
            alt="Jazz logo"
            width={180}
            height={38}
            priority
          />
          <p className="text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
            {me && hasCredentials && isAuthenticated && (
              <>
                {"Signed in as "}
                <span className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                  {me.profile.name}
                </span>
                .
              </>
            )}
            {!hasCredentials && !isAuthenticated && <>Not signed in.</>}
            {!hasCredentials && isAuthenticated && (
              <>Not connected to the authentication server.</>
            )}
            {hasCredentials && !isAuthenticated && (
              <>Authenticated, but not logged in. Try refreshing.</>
            )}
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
