// TODO: Add badge component
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}
export function Badge({ children }: Props) {
  return <div>{children}</div>;
}
