import { SignupForm } from "@/components/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return <SignupForm />;
}
