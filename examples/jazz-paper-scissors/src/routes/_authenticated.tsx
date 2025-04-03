import { Outlet, createFileRoute } from "@tanstack/react-router";
import type { Account } from "jazz-tools";

interface RouterContext {
  me: Account;
}

export const Route = createFileRoute("/_authenticated")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    return context;
  },
});

function RouteComponent() {
  return <Outlet />;
}
