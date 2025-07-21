import { Button } from "@/registry/jazz/ui/button";
import { BookIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Quint</h1>
        <p className="text-muted-foreground">
          Jazz&apos;s best friend UI library.
        </p>
      </header>
      <main className="flex flex-col flex-1 gap-8">
        Hello Quint!
        <Button
          variant="default"
          intent="primary"
          size="lg"
          render={<Link href="/docs/installation" />}
        >
          <BookIcon />
          Read the docs!
        </Button>
      </main>
    </div>
  );
}
