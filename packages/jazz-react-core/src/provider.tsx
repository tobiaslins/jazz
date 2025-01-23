import React from "react";

import { Account, JazzContextType } from "jazz-tools";

export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export const JazzContext = React.createContext<
  JazzContextType<Account> | undefined
>(undefined);
