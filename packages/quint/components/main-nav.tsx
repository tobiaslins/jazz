"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/registry/quint/ui/button";

export function MainNav({
  items,
  className,
  ...props
}: React.ComponentProps<"nav"> & {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center gap-0.5", className)} {...props}>
      {items.map((item) => (
        <Button
          key={item.href}
          className={cn(pathname === item.href && "text-primary")}
          variant="ghost"
          size="sm"
          render={<Link href={item.href} />}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
