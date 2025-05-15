"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "jazz-react";
import { useAuth } from "jazz-react-auth-betterauth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsForm() {
  const router = useRouter();
  const { authClient } = useAuth();
  const { logOut } = useAccount();

  const [error, setError] = useState<Error | undefined>(undefined);

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-md flex flex-col gap-8 w-full px-6 py-12 mx-auto">
          <h1 className="text-stone-950 dark:text-white font-display text-5xl lg:text-6xl font-medium tracking-tighter mb-2">
            Settings
          </h1>

          <Button
            variant="destructive"
            className="relative"
            onClick={async (e) => {
              e.preventDefault();
              const { error } = await authClient.deleteUser(undefined, {
                onSuccess: () => {
                  logOut();
                  router.push("/");
                },
              });
              const errorMessage = error?.message ?? error?.statusText;
              setError(
                error
                  ? {
                      ...error,
                      name: error.statusText,
                      message:
                        errorMessage && errorMessage.length > 0
                          ? errorMessage
                          : "An error occurred",
                    }
                  : undefined,
              );
            }}
          >
            Delete account
          </Button>
        </div>
      </div>
    </>
  );
}
