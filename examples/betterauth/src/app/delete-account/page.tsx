"use client";

import { useAccount } from "jazz-react";
import { Account } from "jazz-tools";
import { redirect } from "next/navigation";

export default function Page() {
  const { logOut } = useAccount(Account, { resolve: { profile: true } });
  logOut();
  redirect("/");
}
