import { Account, AccountClass, JazzContextManager } from "jazz-tools";
import { JazzContextManagerAuthProps } from "jazz-tools/src/implementation/ContextManager.js";
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

export class JazzBrowserContextManager<
  Acc extends Account,
> extends JazzContextManager<Acc, JazzContextManagerProps<Acc>> {
  async createContext(
    props: JazzContextManagerProps<Acc>,
    authProps?: JazzContextManagerAuthProps,
  ) {
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
        credentials: authProps?.credentials,
        newAccountProps: authProps?.newAccountProps,
        defaultProfileName: props.defaultProfileName,
      });
    }

    this.updateContext(props, currentContext);
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
}
