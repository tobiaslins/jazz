import type { BetterAuthClientPlugin } from "better-auth";
import type {
  AuthSecretStorage,
  AuthenticateAccountFunction,
  AuthSetPayload,
} from "jazz-tools";
import { jazzPlugin } from "./server";

/**
 * @param authenticationFunction - The function to authenticate the user, usually JazzContextManager.authenticate
 * @param logOutFunction - The function to log out the user, usually JazzContextManager.logOut
 * @param authSecretStorage - The storage to store the auth secret, usually JazzContextManager.authSecretStorage
 * @returns The BetterAuth client plugin.
 *
 * @example
 * ```ts
 * const context = useJazzContext();
 * const authSecretStorage = useAuthSecretStorage();
 * const auth = betterAuth({
 *   plugins: [jazzPluginClient(context.authenticate, context.logOut, authSecretStorage)],
 * });
 * ```
 */
export const jazzPluginClient = (
  authenticationFunction: AuthenticateAccountFunction,
  logOutFunction: () => Promise<void> | void,
  authSecretStorage: AuthSecretStorage,
) => {
  const authenticateOnJazz = async (jazzAuth: AuthSetPayload) => {
    const parsedJazzAuth = {
      ...jazzAuth,
      secretSeed: jazzAuth.secretSeed
        ? Uint8Array.from(jazzAuth.secretSeed)
        : undefined,
    };

    await authenticationFunction(parsedJazzAuth);
    await authSecretStorage.set(parsedJazzAuth);
  };

  return {
    id: "jazz-plugin",
    $InferServerPlugin: {} as ReturnType<typeof jazzPlugin>,
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
              await logOutFunction();
              return;
            }

            if (context.request.url.toString().includes("/delete-user")) {
              await logOutFunction();
              return;
            }
          },
        },
      },
    ],
  } satisfies BetterAuthClientPlugin;
};
