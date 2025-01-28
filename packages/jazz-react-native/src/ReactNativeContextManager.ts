import { Account, AccountClass, JazzContextManager, KvStore } from "jazz-tools";
import { JazzContextManagerAuthProps } from "jazz-tools";
import {
  BaseReactNativeContextOptions,
  createJazzReactNativeContext,
  createJazzReactNativeGuestContext,
} from "./platform.js";

export type JazzContextManagerProps<Acc extends Account> = {
  guestMode?: boolean;
  peer: `wss://${string}` | `ws://${string}`;
  localOnly?: "always" | "anonymous" | "off";
  onLogOut?: () => void;
  storage?: BaseReactNativeContextOptions["storage"];
  AccountSchema?: AccountClass<Acc>;
  defaultProfileName?: string;
};

export class ReactNativeContextManager<
  Acc extends Account,
> extends JazzContextManager<Acc, JazzContextManagerProps<Acc>> {
  async createContext(
    props: JazzContextManagerProps<Acc>,
    authProps?: JazzContextManagerAuthProps,
  ) {
    let currentContext;

    // We need to store the props here to block the double effect execution
    // on React. Otherwise when calling propsChanged this.props is undefined.
    this.props = props;

    if (props.guestMode) {
      currentContext = await createJazzReactNativeGuestContext({
        peer: props.peer,
        storage: props.storage,
        localOnly: props.localOnly,
        authSecretStorage: this.authSecretStorage,
      });
    } else {
      currentContext = await createJazzReactNativeContext<Acc>({
        peer: props.peer,
        storage: props.storage,
        localOnly: props.localOnly,
        AccountSchema: props.AccountSchema,
        credentials: authProps?.credentials,
        newAccountProps: authProps?.newAccountProps,
        defaultProfileName: props.defaultProfileName,
        authSecretStorage: this.authSecretStorage,
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
      props.guestMode !== this.props.guestMode ||
      props.localOnly !== this.props.localOnly
    );
  }
}
