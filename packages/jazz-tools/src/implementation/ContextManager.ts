import { AgentSecret, LocalNode } from "cojson";
import { Account, AnonymousJazzAgent, AuthCredentials } from "jazz-tools";
import { JazzContextType } from "jazz-tools";

export type JazzContextManagerAuthProps = {
  credentials?: AuthCredentials;
  newAccountProps?: { secret: AgentSecret; creationProps: { name: string } };
};

type Props = {
  localOnly?: boolean;
};

type PlatformSpecificAuthContext<Acc extends Account> = {
  me: Acc;
  node: LocalNode;
  toggleNetwork: (enabled: boolean) => void;
  logOut: () => void;
  done: () => void;
};

type PlatformSpecificGuestContext = {
  guest: AnonymousJazzAgent;
  node: LocalNode;
  toggleNetwork: (enabled: boolean) => void;
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

  toggleNetwork = (enabled: boolean) => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.toggleNetwork(enabled);
    this.props.localOnly = enabled;
  };

  logOut = () => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.logOut();
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
