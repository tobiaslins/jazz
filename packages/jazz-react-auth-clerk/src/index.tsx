import {
  BrowserClerkAuth,
  type MinimalClerkClient,
} from "jazz-browser-auth-clerk";
import { JazzProvider, JazzProviderProps, useJazzContext } from "jazz-react";
import { useEffect, useMemo } from "react";

function useJazzClerkAuth(clerk: MinimalClerkClient) {
  const context = useJazzContext();

  const authMethod = useMemo(() => {
    return new BrowserClerkAuth(context.authenticate);
  }, []);

  useEffect(() => {
    authMethod.onClerkUserChange(clerk);
  }, [clerk.user]);
}

function RegisterClerkAuth(props: {
  clerk: MinimalClerkClient;
  children: React.ReactNode;
}) {
  useJazzClerkAuth(props.clerk);

  return props.children;
}

export const JazzProviderWithClerk = (
  props: { clerk: MinimalClerkClient } & JazzProviderProps,
) => {
  return (
    <JazzProvider {...props} onLogOut={props.clerk.signOut}>
      <RegisterClerkAuth clerk={props.clerk}>
        {props.children}
      </RegisterClerkAuth>
    </JazzProvider>
  );
};
