import { SignupForm } from "@/components/signup-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | Jazz Example: Better Auth",
};

export default function LoginPage() {
  return <SignupForm />;
}
