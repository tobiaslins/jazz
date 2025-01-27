import { AgentSecret, LocalNode } from "cojson";
import { AuthSecretStorage } from "../auth/AuthSecretStorage.js";
import { InMemoryKVStore } from "../auth/InMemoryKVStore.js";
import { KvStore, KvStoreContext } from "../auth/KvStoreContext.js";
import { Account } from "../coValues/account.js";
import { AuthCredentials } from "../types.js";
import { JazzContextType } from "../types.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";

export type JazzContextManagerAuthProps = {
  credentials?: AuthCredentials;
  newAccountProps?: { secret: AgentSecret; creationProps: { name: string } };
};

type Props = {
  localOnly?: "always" | "anonymous" | "off";
  onLogOut?: () => void;
};

type PlatformSpecificAuthContext<Acc extends Account> = {
  me: Acc;
  node: LocalNode;
  logOut: () => void;
  done: () => void;
};

type PlatformSpecificGuestContext = {
  guest: AnonymousJazzAgent;
  node: LocalNode;
  logOut: () => void;
  done: () => void;
};

type PlatformSpecificContext<Acc extends Account> =
  | PlatformSpecificAuthContext<Acc>
  | PlatformSpecificGuestContext;

export class JazzContextManager<Acc extends Account, P extends Props> {
  protected value: JazzContextType<Acc> | undefined;
  protected context: PlatformSpecificContext<Acc> | undefined;
  protected props: P | undefined;
  protected authSecretStorage = new AuthSecretStorage();

  constructor() {
    KvStoreContext.getInstance().initialize(this.getKvStore());
  }

  getKvStore(): KvStore {
    return new InMemoryKVStore();
  }

  async createContext(props: P, authProps?: JazzContextManagerAuthProps) {
    props;
    authProps;
    throw new Error("Not implemented");
  }

  updateContext(props: P, context: PlatformSpecificContext<Acc>) {
    this.context?.done();

    this.context = context;
    this.props = props;
    this.value = {
      ...context,
      node: context.node,
      authenticate: this.authenticate,
      register: this.register,
      logOut: this.logOut,
    };

    this.notify();
  }

  propsChanged(props: P) {
    props;
    throw new Error("Not implemented");
  }

  getCurrentValue() {
    return this.value;
  }

  getAuthSecretStorage() {
    return this.authSecretStorage;
  }

  logOut = () => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.logOut();
    this.props.onLogOut?.();
    return this.createContext(this.props);
  };

  done = () => {
    if (!this.context) {
      return;
    }

    this.context.done();
  };

  authenticate = async (credentials: AuthCredentials) => {
    if (!this.props) {
      throw new Error("Props required");
    }

    return this.createContext(this.props, { credentials });
  };

  register = async (
    accountSecret: AgentSecret,
    creationProps: { name: string },
  ) => {
    if (!this.props) {
      throw new Error("Props required");
    }

    await this.createContext(this.props, {
      newAccountProps: { secret: accountSecret, creationProps },
    });

    if (!this.context) {
      throw new Error("No context created");
    }

    if ("me" in this.context) {
      return this.context.me.id;
    }

    throw new Error("No account created");
  };

  listeners = new Set<() => void>();
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  };

  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
