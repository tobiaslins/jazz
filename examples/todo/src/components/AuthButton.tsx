"use client";

import { Button } from "@/basicComponents/ui/button";
import { useAccount, useIsAnonymousUser } from "jazz-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function AuthButton() {
  const [open, setOpen] = useState(false);
  const { logOut } = useAccount();

  const isOnboarding = useIsAnonymousUser();

  function handleSignOut() {
    logOut();
    window.history.pushState({}, "", "/");
  }

  if (!isOnboarding) {
    return (
      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-white text-black hover:bg-gray-100"
      >
        Sign up
      </Button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}
