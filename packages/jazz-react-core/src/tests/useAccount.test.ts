// @vitest-environment happy-dom

import { Account, CoMap, co } from "jazz-tools";
import { beforeEach, describe, expect, it } from "vitest";
import { createUseAccountHooks } from "../hooks.js";
import { useIsAuthenticated } from "../index.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";
import { act, renderHook } from "./testUtils.js";

const { useAccount } = createUseAccountHooks<Account>();

beforeEach(async () => {
  await setupJazzTestSync();
});

describe("useAccount", () => {
  it("should return the correct value", async () => {
    const account = await createJazzTestAccount();

    const { result } = renderHook(() => useAccount(), {
      account,
    });

    expect(result.current?.me).toEqual(account);
  });

  it("should load nested values if requested", async () => {
    class AccountRoot extends CoMap {
      value = co.string;
    }

    class AccountSchema extends Account {
      root = co.ref(AccountRoot);

      migrate() {
        if (!this._refs.root) {
          this.root = AccountRoot.create({ value: "123" }, { owner: this });
        }
      }
    }

    const { useAccount } = createUseAccountHooks<AccountSchema>();

    const account = await createJazzTestAccount({ AccountSchema });

    const { result } = renderHook(
      () =>
        useAccount({
          root: {},
        }),
      {
        account,
      },
    );

    expect(result.current?.me?.root?.value).toBe("123");
  });

  it("should be in sync with useIsAuthenticated", async () => {
    const account = await createJazzTestAccount({});

    const { result } = renderHook(
      () => {
        const isAuthenticated = useIsAuthenticated();
        const account = useAccount();

        return { isAuthenticated, account };
      },
      {
        account,
        isAuthenticated: true,
      },
    );

    expect(result.current?.isAuthenticated).toBe(true);
    expect(result.current?.account?.me).toBeDefined();

    const id = result.current?.account?.me?.id;

    await act(async () => {
      await result.current?.account?.logOut();
    });

    expect(result.current?.isAuthenticated).toBe(false);
    expect(result.current?.account?.me.id).not.toBe(id);
    expect(result.current?.account?.me.id).toBeDefined();
  });
});
