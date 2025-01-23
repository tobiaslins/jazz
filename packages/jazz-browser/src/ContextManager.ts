import { AgentSecret } from "cojson";
import { Account, AccountClass, AuthCredentials } from "jazz-tools";
import { JazzContextType } from "jazz-tools";
import {
  BaseBrowserContextOptions,
  BrowserContext,
  BrowserGuestContext,
  createJazzBrowserContext,
  createJazzBrowserGuestContext,
} from "./createBrowserContext.js";

export type JazzContextManagerProps<Acc extends Account> = {
  guestMode?: boolean;
  peer: `wss://${string}` | `ws://${string}`;
  localOnly?: boolean;
  storage?: BaseBrowserContextOptions["storage"];
  AccountSchema?: AccountClass<Acc>;
  defaultProfileName?: string;
};

type UntrackedProps = {
  credentials?: AuthCredentials;
  newAccountProps?: { secret: AgentSecret; creationProps: { name: string } };
};

export class JazzContextManager<Acc extends Account> {
  private value: JazzContextType<Acc> | undefined;
  private context: BrowserGuestContext | BrowserContext<Acc> | undefined;
  private props: JazzContextManagerProps<Acc> | undefined;

  async createContext(
    props: JazzContextManagerProps<Acc>,
    untrackedProps?: UntrackedProps,
  ) {
    this.props = { ...props };

    let currentContext: BrowserGuestContext | BrowserContext<Acc>;

    if (props.guestMode) {
      currentContext = await createJazzBrowserGuestContext({
        peer: props.peer,
        storage: props.storage,
        localOnly: props.localOnly,
      });
    } else {
      currentContext = await createJazzBrowserContext<Acc>({
        peer: props.peer,
        storage: props.storage,
        localOnly: props.localOnly,
        AccountSchema: props.AccountSchema,
        credentials: untrackedProps?.credentials,
        newAccountProps: untrackedProps?.newAccountProps,
        defaultProfileName: props.defaultProfileName,
      });
    }

    this.updateContext(props, currentContext);
  }

  updateContext(
    props: JazzContextManagerProps<Acc>,
    context: BrowserGuestContext | BrowserContext<Acc>,
  ) {
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

  propsChanged(props: JazzContextManagerProps<Acc>) {
    if (!this.props) {
      return true;
    }

    return (
      props.peer !== this.props.peer ||
      props.storage !== this.props.storage ||
      props.guestMode !== this.props.guestMode
    );
  }

  getCurrentValue() {
    return this.value;
  }

  toggleNetwork = (enabled: boolean) => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.toggleNetwork?.(enabled);
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
