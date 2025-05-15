import { SigninForm } from "@/components/signin-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Jazz Example: Better Auth",
};

export default function LoginPage() {
  return <SigninForm />;
}
