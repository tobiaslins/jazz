// @vitest-environment happy-dom

import { render, waitFor } from "@testing-library/react";
import type { MinimalClerkClient } from "jazz-browser-auth-clerk";
import { Account, AuthSecretStorage, ID } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JazzProviderWithClerk } from "../index";

vi.mock("jazz-react", async (importOriginal) => {
  const { JazzTestProvider, createJazzTestAccount } = await import(
    "jazz-react/testing"
  );

  const account = await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });

  function JazzProvider(props: { children: React.ReactNode }) {
    return (
      <JazzTestProvider account={account}>{props.children}</JazzTestProvider>
    );
  }

  return {
    ...(await importOriginal<typeof import("jazz-react")>()),
    JazzProvider,
  };
});

const authSecretStorage = new AuthSecretStorage();

describe("JazzProviderWithClerk", () => {
  beforeEach(async () => {
    await authSecretStorage.clear();
    await authSecretStorage.set({
      accountID: "test123" as any as ID<Account>,
      secretSeed: new Uint8Array([1, 2, 3]),
      accountSecret: "secret123" as any,
      provider: "anonymous",
    });
  });

  const setup = (
    children = <div data-testid="test-child">Test Content</div>,
  ) => {
    const mockClerk = {
      user: {
        fullName: "Test User",
        unsafeMetadata: {},
        update: vi.fn(),
      },
      signOut: vi.fn().mockImplementation(() => {
        mockClerk.user = null;
      }),
    } as unknown as MinimalClerkClient;

    const utils = render(
      <JazzProviderWithClerk clerk={mockClerk} peer="wss://test.jazz.tools">
        {children}
      </JazzProviderWithClerk>,
    );

    return {
      ...utils,
      mockClerk,
    };
  };

  it("should handle clerk user changes", async () => {
    const { mockClerk } = setup();

    await waitFor(() => {
      expect(mockClerk.user?.update).toHaveBeenCalledWith({
        unsafeMetadata: {
          jazzAccountID: "test123",
          jazzAccountSecret: "secret123",
          jazzAccountSeed: [1, 2, 3],
        },
      });
    });
  });
});
