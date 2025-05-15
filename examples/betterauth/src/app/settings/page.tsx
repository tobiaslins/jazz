import SettingsForm from "@/components/forms/Settings";
import { Navbar } from "@/components/navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Jazz Example: Better Auth",
};

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <SettingsForm />;
    </>
  );
}
