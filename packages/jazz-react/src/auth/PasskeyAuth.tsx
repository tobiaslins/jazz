import { BrowserPasskeyAuth } from "jazz-browser";
import { useJazzContext } from "jazz-react-core";
import { useMemo, useState } from "react";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * `usePasskeyAuth` hook provides a `JazzAuth` object for passkey authentication.
 *
 * @example
 * ```ts
 * const [auth, state] = usePasskeyAuth({ appName, appHostname });
 * ```
 *
 * @category Auth Providers
 */
export function usePasskeyAuth({
  appName,
  appHostname,
}: {
  appName: string;
  appHostname?: string;
}) {
  const context = useJazzContext();

  const authMethod = useMemo(() => {
    return new BrowserPasskeyAuth(
      context.node.crypto,
      context.authenticate,
      appName,
      appHostname,
    );
  }, [appName, appHostname]);

  const isAuthenticated = useIsAuthenticated();

  return {
    state: isAuthenticated ? "signedIn" : "anonymous",
    logIn: authMethod.logIn,
    signUp: authMethod.signUp,
  } as const;
}

export const PasskeyAuthBasicUI = (
  props: ReturnType<typeof usePasskeyAuth>,
) => {
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (props.state === "signedIn") {
    return null;
  }

  const { logIn, signUp } = props;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div
        style={{
          width: "18rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <form
          style={{
            width: "18rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            signUp(username).catch((error) => setError(error.message));
          }}
        >
          <input
            placeholder="Display name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="webauthn"
            style={{
              border: "2px solid #000",
              padding: "11px 8px",
              borderRadius: "6px",
            }}
          />
          <input
            type="submit"
            value="Sign up"
            style={{
              background: "#000",
              color: "#fff",
              padding: "13px 5px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
        </form>
        <button
          onClick={() => {
            setError(null);
            logIn().catch((error) => setError(error.message));
          }}
          style={{
            background: "#000",
            color: "#fff",
            padding: "13px 5px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Log in with existing account
        </button>
      </div>
    </div>
  );
};
