import { WasmCrypto } from "cojson";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  Account,
  AuthSecretStorage,
  InMemoryKVStore,
  JazzAuthContext,
  JazzContextType,
  KvStoreContext,
} from "../exports";
import {
  JazzContextManager,
  JazzContextManagerAuthProps,
  JazzContextManagerBaseProps,
} from "../implementation/ContextManager";
import {
  createJazzContext,
  randomSessionProvider,
} from "../implementation/createContext";
import {
  createJazzTestAccount,
  getPeerConnectedToTestSyncServer,
  setupJazzTestSync,
} from "../testing";

const Crypto = await WasmCrypto.create();

class TestJazzContextManager extends JazzContextManager<
  Account,
  JazzContextManagerBaseProps & {
    defaultProfileName?: string;
  }
> {
  async createContext(
    props: JazzContextManagerBaseProps & {
      defaultProfileName?: string;
    },
    authProps?: JazzContextManagerAuthProps,
  ) {
    const context = await createJazzContext({
      credentials: authProps?.credentials,
      defaultProfileName: props.defaultProfileName,
      newAccountProps: authProps?.newAccountProps,
      peersToLoadFrom: [getPeerConnectedToTestSyncServer()],
      crypto: Crypto,
      sessionProvider: randomSessionProvider,
      authSecretStorage: this.getAuthSecretStorage(),
    });

    this.updateContext(props, {
      me: context.account,
      node: context.node,
      done: () => {
        context.done();
      },
      logOut: () => {
        context.logOut();
      },
    });
  }
}

describe("ContextManager", () => {
  let manager: TestJazzContextManager;
  let authSecretStorage: AuthSecretStorage;

  function getCurrentValue() {
    return manager.getCurrentValue() as JazzAuthContext<Account>;
  }

  beforeEach(async () => {
    KvStoreContext.getInstance().initialize(new InMemoryKVStore());
    authSecretStorage = new AuthSecretStorage();
    await authSecretStorage.clear();
    await setupJazzTestSync();

    manager = new TestJazzContextManager();
  });

  test("creates new context when initialized", async () => {
    await manager.createContext({});

    const context = getCurrentValue();

    expect(context.me.profile?.name).toBe("Anonymous user");
    expect(context.node).toBeDefined();
    expect(manager.getCurrentValue()).toBeDefined();
  });

  test("creates new context when initialized with default profile name", async () => {
    await manager.createContext({
      defaultProfileName: "Test User",
    });

    const context = getCurrentValue();

    expect(context.me.profile?.name).toBe("Test User");
    expect(context.node).toBeDefined();
    expect(manager.getCurrentValue()).toBeDefined();
  });

  test("handles authentication with credentials", async () => {
    const account = await createJazzTestAccount();

    // First create an initial context to get credentials
    await manager.createContext({});

    const credentials = {
      accountID: account.id,
      accountSecret: account._raw.core.node.account.agentSecret,
      provider: "test",
    };

    // Authenticate with those credentials
    await manager.authenticate(credentials);

    expect(getCurrentValue().me.id).toBe(credentials.accountID);
  });

  test("handles registration with new account", async () => {
    await manager.createContext({});

    const secret = Crypto.newRandomAgentSecret();
    const accountId = await manager.register(secret, { name: "Test User" });

    expect(accountId).toBeDefined();
    expect(getCurrentValue().me.profile?.name).toBe("Test User");
  });

  test("calls onLogOut callback when logging out", async () => {
    const onLogOut = vi.fn();
    await manager.createContext({ onLogOut });

    await manager.logOut();

    expect(onLogOut).toHaveBeenCalled();
  });

  test("notifies listeners of context changes", async () => {
    const listener = vi.fn();
    manager.subscribe(listener);

    await manager.createContext({});

    expect(listener).toHaveBeenCalled();
  });

  test("cleans up context when done", async () => {
    await manager.createContext({});

    const context = manager.getCurrentValue();
    expect(context).toBeDefined();

    manager.done();

    // Should still have context, just cleaned up
    expect(manager.getCurrentValue()).toBe(context);
  });
});
