import type { BetterAuthClientPlugin } from "better-auth";
import type {
  AuthSecretStorage,
  AuthSetPayload,
  Account,
  JazzContextType,
} from "jazz-tools";
import { jazzPlugin } from "./server";

/**
 * @example
 * ```ts
 * const auth = betterAuth({
 *   plugins: [jazzPluginClient()],
 * });
 * ```
 */
export const jazzPluginClient = () => {
  let jazzContext: JazzContextType<Account>;
  let authSecretStorage: AuthSecretStorage;

  const authenticateOnJazz = async (jazzAuth: AuthSetPayload) => {
    const parsedJazzAuth = {
      ...jazzAuth,
      secretSeed: jazzAuth.secretSeed
        ? Uint8Array.from(jazzAuth.secretSeed)
        : undefined,
    };

    await jazzContext.authenticate(parsedJazzAuth);
    await authSecretStorage.set(parsedJazzAuth);
  };

  return {
    id: "jazz-plugin",
    $InferServerPlugin: {} as ReturnType<typeof jazzPlugin>,
    getActions: () => {
      return {
        jazz: {
          setJazzContext: (context: JazzContextType<Account>) => {
            jazzContext = context;
          },
          setAuthSecretStorage: (storage: AuthSecretStorage) => {
            authSecretStorage = storage;
          },
        },
      };
    },
    fetchPlugins: [
      {
        id: "jazz-plugin",
        name: "jazz-plugin",
        hooks: {
          async onRequest(context) {
            if (
              context.url.toString().includes("/sign-up") ||
              context.url.toString().includes("/sign-in/social")
            ) {
              const credentials = await authSecretStorage.get();

              if (!credentials) {
                throw new Error("Jazz credentials not found");
              }

              context.headers.set(
                "x-jazz-auth",
                JSON.stringify({
                  accountID: credentials.accountID,
                  secretSeed: credentials.secretSeed,
                  accountSecret: credentials.accountSecret,
                }),
              );
            }
          },
          async onSuccess(context) {
            if (context.request.url.toString().includes("/sign-up")) {
              await authenticateOnJazz(context.data.jazzAuth);
              return;
            }

            if (context.request.url.toString().includes("/sign-in/email")) {
              await authenticateOnJazz(context.data.jazzAuth);
              return;
            }

            if (context.request.url.toString().includes("/get-session")) {
              if (context.data === null) {
                if (authSecretStorage.isAuthenticated === true) {
                  console.warn(
                    "Jazz is not authenticated, but the session is null",
                  );
                }
                return;
              }

              if (!context.data?.user) {
                return;
              }

              if (authSecretStorage.isAuthenticated === false) {
                console.info(
                  "Jazz is not authenticated, using Better Auth stored credentials",
                );
                await authenticateOnJazz(context.data.jazzAuth);
                return;
              }

              const sessionAccountID = context.data.user.accountID;

              const credentials = await authSecretStorage.get();

              if (!credentials) {
                throw new Error("Jazz credentials not found");
              }

              if (credentials.accountID !== sessionAccountID) {
                console.info(
                  "Jazz credentials mismatch, using Better Auth stored credentials",
                );
                await authenticateOnJazz(context.data.jazzAuth);
              }
              return;
            }

            if (context.request.url.toString().includes("/sign-out")) {
              await jazzContext.logOut();
              return;
            }

            if (context.request.url.toString().includes("/delete-user")) {
              await jazzContext.logOut();
              return;
            }
          },
        },
      },
    ],
  } satisfies BetterAuthClientPlugin;
};
