import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { OAuth2Server } from "oauth2-mock-server";
import { jazzPlugin } from "../server.js";
import { genericOAuth } from "better-auth/plugins";

describe("Better Auth - Signup and Login Tests", async () => {
  const providerId = "test";
  const clientId = "test-client-id";
  const clientSecret = "test-client-secret";
  const server = new OAuth2Server();
  await server.start();
  const oauthPort = Number(server.issuer.url?.split(":")[2]!);

  let auth: ReturnType<
    typeof betterAuth<{
      plugins: ReturnType<typeof jazzPlugin | typeof genericOAuth>[];
    }>
  >;
  let accountCreationSpy: Mock;
  let verificationCreationSpy: Mock;

  beforeAll(async () => {
    await server.issuer.keys.generate("RS256");

    server.service.on("beforeUserinfo", (userInfoResponse) => {
      userInfoResponse.body = {
        email: "oauth2@test.com",
        name: "OAuth2 Test",
        sub: "oauth2",
        picture: "https://test.com/picture.png",
        email_verified: true,
      };
      userInfoResponse.statusCode = 200;
    });
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    accountCreationSpy = vi.fn();
    verificationCreationSpy = vi.fn();

    // Create auth instance with in-memory database
    auth = betterAuth({
      database: memoryAdapter({
        user: [],
        session: [],
        verification: [],
        account: [],
      }),
      baseURL: "http://localhost:3000",
      plugins: [
        jazzPlugin(),
        genericOAuth({
          config: [
            {
              providerId,
              discoveryUrl: `http://localhost:${oauthPort}/.well-known/openid-configuration`,
              authorizationUrl: `http://localhost:${oauthPort}/authorize`,
              clientId: clientId,
              clientSecret: clientSecret,
              pkce: true,
            },
          ],
        }),
      ],
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Disable for testing
      },
      socialProviders: {
        github: {
          clientId: "123",
          clientSecret: "123",
        },
      },
      databaseHooks: {
        user: {
          create: {
            after: accountCreationSpy,
          },
        },
        verification: {
          create: {
            after: verificationCreationSpy,
          },
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      },
    });
  });

  describe("User Registration (Signup)", () => {
    it("should successfully register a new user with email and password", async () => {
      const userData = {
        name: "test",
        email: "test@example.com",
        password: "securePassword123",
      };

      const jazzAuth = {
        accountID: "123",
        secretSeed: [1, 2, 3],
        accountSecret: "123",
        provider: "better-auth",
      };

      const result = await auth.api.signUpEmail({
        body: userData,
        headers: {
          "x-jazz-auth": JSON.stringify(jazzAuth),
        },
      });

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        user: {
          id: expect.any(String),
          email: userData.email,
          name: userData.name,
          image: undefined,
          emailVerified: false,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        jazzAuth: jazzAuth,
      });

      const res = await (await auth.$context).adapter.findOne({
        model: "user",
        where: [
          {
            field: "id",
            value: result.user.id,
          },
        ],
      });

      expect(res).toMatchObject({
        id: result.user.id,
        accountID: "123",
        encryptedCredentials: expect.any(String),
      });
    });

    it("should fail to register user without account ID", async () => {
      const userData = {
        name: "test",
        email: "email@email.it",
        password: "securePassword123",
      };

      await expect(
        auth.api.signUpEmail({
          body: userData,
        }),
      ).rejects.toThrow("JazzAuth is required");

      expect(accountCreationSpy).toHaveBeenCalledTimes(0);
    });

    it("should have AccountID in the registration hook", async () => {
      const userData = {
        name: "test",
        email: "email@email.it",
        password: "securePassword123",
      };

      const jazzAuth = {
        accountID: "123",
        secretSeed: [1, 2, 3],
        accountSecret: "123",
        provider: "better-auth",
      };

      await auth.api.signUpEmail({
        body: userData,
        headers: {
          "x-jazz-auth": JSON.stringify(jazzAuth),
        },
      });

      expect(accountCreationSpy).toHaveBeenCalledTimes(1);
      expect(accountCreationSpy).toHaveBeenCalledWith(
        // user
        expect.objectContaining({ accountID: "123" }),
        // context
        expect.any(Object),
      );
    });
  });

  describe("User login (Signin)", () => {
    it("should successfully login a new user with email and password", async () => {
      const userData = {
        name: "test",
        email: "test@example.com",
        password: "securePassword123",
      };

      const jazzAuth = {
        accountID: "123",
        secretSeed: [1, 2, 3],
        accountSecret: "123",
        provider: "better-auth",
      };

      await auth.api.signUpEmail({
        body: userData,
        headers: {
          "x-jazz-auth": JSON.stringify(jazzAuth),
        },
      });

      const result = await auth.api.signInEmail({
        body: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        user: {
          id: expect.any(String),
          email: userData.email,
          name: userData.name,
          image: undefined,
          emailVerified: false,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        jazzAuth: jazzAuth,
      });
    });
  });

  describe("Social Login", () => {
    it("should store jazzAuth in verification table when using social provider", async () => {
      await auth.api.signInSocial({
        body: {
          provider: "github",
          callbackURL: "http://localhost:3000/api/auth/sign-in/social/callback",
        },
        headers: {
          "x-jazz-auth": JSON.stringify({
            accountID: "123",
            secretSeed: [1, 2, 3],
            accountSecret: "123",
          }),
        },
      });

      expect(verificationCreationSpy).toHaveBeenCalledTimes(1);
      expect(verificationCreationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.stringContaining('"accountID":"123"'),
        }),
        expect.any(Object),
      );
    });

    it("should create a new account with jazz auth when using social provider", async () => {
      const response = await auth.api.signInSocial({
        body: {
          provider: providerId,
          callbackURL: "http://localhost:3000/api/auth/sign-in/social/callback",
          newUserCallbackURL:
            "http://localhost:3000/api/auth/sign-in/social/callback",
        },
        headers: {
          "x-jazz-auth": JSON.stringify({
            accountID: "123",
            secretSeed: [1, 2, 3],
            accountSecret: "123",
          }),
        },
      });

      const oauthres = await fetch(response.url as string, {
        redirect: "manual",
      });

      const resURL = new URL(oauthres.headers.get("Location") as string);

      const callbackRes = await auth.handler(new Request(resURL));

      expect(callbackRes.headers.getSetCookie()[0]).toMatch(
        "better-auth.session_token=",
      );

      expect(accountCreationSpy).toHaveBeenCalledTimes(1);
      expect(accountCreationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ accountID: "123" }),
        expect.any(Object),
      );
    });
  });
});
