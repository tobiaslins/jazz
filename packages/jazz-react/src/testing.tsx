import { PureJSCrypto } from "cojson/crypto";
import { Account, AccountClass } from "jazz-tools";
import { useMemo } from "react";
import { RegisteredAccount } from "./provider.js";
import { JazzContext } from "./provider.js";

export async function createJazzTestAccount<
  Acc extends RegisteredAccount,
>(options?: {
  AccountSchema?: AccountClass<Acc>;
}): Promise<Acc> {
  const AccountSchema =
    options?.AccountSchema ?? (Account as unknown as AccountClass<Acc>);
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
