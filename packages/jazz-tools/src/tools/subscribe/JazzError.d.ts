import type { CoValue, ID } from "../internal.js";
export declare class JazzError {
  id: ID<CoValue> | undefined;
  type: "unavailable" | "unauthorized";
  issues: JazzErrorIssue[];
  constructor(
    id: ID<CoValue> | undefined,
    type: "unavailable" | "unauthorized",
    issues: JazzErrorIssue[],
  );
  toString(): string;
  prependPath(item: string): JazzError;
}
export type JazzErrorIssue = {
  code: "unavailable" | "unauthorized" | "validationError";
  message: string;
  params: Record<string, any>;
  path: string[];
};
