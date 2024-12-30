import { AgentSecret } from "cojson";
import { PureJSCrypto } from "cojson/crypto";
import {
  Account,
  AccountClass,
  CoValueClass,
  CryptoProvider,
  Peer,
} from "jazz-tools";
import { useMemo } from "react";
import { RegisteredAccount } from "./provider.js";
import { JazzContext } from "./provider.js";

type TestAccountSchema<Acc extends RegisteredAccount> = CoValueClass<Acc> & {
  fromNode: (typeof Account)["fromNode"];
  create: (options: {
    creationProps: { name: string };
    initialAgentSecret?: AgentSecret;
    peersToLoadFrom?: Peer[];
    crypto: CryptoProvider;
  }) => Promise<Acc>;
};

export async function createJazzTestAccount<
  Acc extends RegisteredAccount,
>(options?: {
  AccountSchema?: TestAccountSchema<Acc>;
}): Promise<Acc> {
  const AccountSchema =
    options?.AccountSchema ?? (Account as unknown as TestAccountSchema<Acc>);
  const account = await AccountSchema.create({
    creationProps: {
      name: "Test Account",
    },
    crypto: await PureJSCrypto.create(),
  });

  return account;
}

export type JazzTestContext<Acc extends RegisteredAccount> = {
  account: Acc;
  done: () => void;
  AccountSchema: AccountClass<Acc>;
};

export function JazzTestProvider<Acc extends RegisteredAccount>({
  children,
  account,
}: {
  children: React.ReactNode;
  account: Acc;
}) {
  const value = useMemo(() => {
    return {
      me: account,
      AccountSchema: account.constructor as AccountClass<Acc>,
      logOut: () => account._raw.core.node.gracefulShutdown(),
      done: () => account._raw.core.node.gracefulShutdown(),
    };
  }, [account]);

  return <JazzContext.Provider value={value}>{children}</JazzContext.Provider>;
}
