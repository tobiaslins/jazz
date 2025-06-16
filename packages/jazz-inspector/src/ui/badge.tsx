import { styled } from "goober";

export const Badge = styled("span")<{ className?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.125rem 0.25rem;
  margin-left: -0.125rem;
  border-radius: var(--j-radius-sm);
  background-color: var(--j-foreground);
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--j-text-color-strong);
`;
