// @vitest-environment happy-dom

import { cojsonInternals } from "cojson";
import { co } from "jazz-tools";
import { describe, bench } from "vitest";
import {
  useAccountSubscription,
  useSubscriptionSelector,
  useAccountWithSelector,
  CoValueSubscription,
} from "../index.js";
import { createJazzTestAccount, setupJazzTestSync } from "../testing.js";
import { render } from "./testUtils.js";

cojsonInternals.setCoValueLoadingRetryDelay(300);

await setupJazzTestSync();
await createJazzTestAccount({
  isCurrentActiveAccount: true,
  creationProps: { name: "Hermes Puggington" },
});

const AccountSchema = co.account();

const AccountName = () => {
  const name = useAccountWithSelector(AccountSchema, {
    resolve: {
      profile: true,
    },
    select: (account) => account?.profile?.name,
  });

  if (!name) return null;

  return <span>{name}</span>;
};

const AccountNameFromSubscription = ({
  subscription,
}: {
  subscription: CoValueSubscription<typeof AccountSchema, { profile: true }>;
}) => {
  const name = useSubscriptionSelector(subscription, {
    select: (account) => account?.profile?.name,
  });

  if (!name) return null;

  return <span>{name}</span>;
};

const UseAccountWithSelector = () => {
  return (
    <div>
      {Array.from({ length: 1000 }).map((_, i) => (
        <AccountName key={i} />
      ))}
    </div>
  );
};

const UseAccountSubscription = () => {
  const subscription = useAccountSubscription(AccountSchema, {
    resolve: {
      profile: true,
    },
  });

  return (
    <div>
      {Array.from({ length: 1000 }).map((_, i) => (
        <AccountNameFromSubscription key={i} subscription={subscription} />
      ))}
    </div>
  );
};

describe("1000 value loads", () => {
  bench(
    "useAccountSubscription + useSubscriptionSelector",
    () => {
      render(<UseAccountSubscription />);
    },
    { iterations: 50 },
  );

  bench(
    "useAccountWithSelector",
    () => {
      render(<UseAccountWithSelector />);
    },
    { iterations: 50 },
  );
});
