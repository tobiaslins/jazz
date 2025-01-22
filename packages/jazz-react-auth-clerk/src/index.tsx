import { BrowserClerkAuth } from "jazz-browser-auth-clerk";
import { useMemo, useState } from "react";

import type { Clerk } from "@clerk/clerk-js";

export function useJazzClerkAuth(
  clerk: Clerk & {
    signOut: () => Promise<unknown>;
  },
) {
  const [state, setState] = useState<{ errors: string[] }>({ errors: [] });

  const authMethod = useMemo(() => {
    return new BrowserClerkAuth(
      {
        onError: (error) => {
          void clerk.signOut();
          setState((state) => ({
            ...state,
            errors: [...state.errors, error.toString()],
          }));
        },
      },
      clerk,
    );
  }, [clerk.user]);

  return [authMethod, state] as const;
}
