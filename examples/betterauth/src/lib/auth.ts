import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db";
import Database from "better-sqlite3";
import { jazzPlugin } from "jazz-betterauth-server-plugin";
import { socialProviders } from "./socialProviders";

export const auth = await (async () => {
  // Configure Better Auth server
  const auth = betterAuth({
    appName: "Jazz Example: Better Auth",
    database: new Database("sqlite.db"),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: () => {
        throw new Error("Not implemented");
      },
    },
    emailVerification: {
      sendVerificationEmail() {
        throw new Error("Not implemented");
      },
    },
    socialProviders,
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [jazzPlugin()],
    databaseHooks: {
      user: {
        create: {
          after: () => {
            // Here we can send a welcome email to the user
            throw new Error("Not implemented");
          },
        },
      },
    },
  });

  // Run database migrations
  const migrations = await getMigrations(auth.options);
  await migrations.runMigrations();

  return auth;
})();
