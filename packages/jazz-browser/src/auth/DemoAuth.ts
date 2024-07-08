import { AgentSecret, CryptoProvider, Peer } from "cojson";
import { Account, CoValueClass, ID, isControlledAccount } from "jazz-tools";
import { AuthProvider } from "./auth.js";
import { SessionProvider } from "../index.js";

type StorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "demo-auth-logged-in-secret";

const localStorage = {} as Storage;
// typeof window === "undefined" ? ({} as Storage) : window.localStorage;

export class BrowserDemoAuth<Acc extends Account> implements AuthProvider<Acc> {
    constructor(
        public accountSchema: CoValueClass<Acc> & typeof Account,
        public driver: BrowserDemoAuth.Driver,
        public appName: string,
        seedAccounts?: {
            [name: string]: {
                accountID: ID<Account>;
                accountSecret: AgentSecret;
            };
        },
    ) {
        for (const [name, credentials] of Object.entries(seedAccounts || {})) {
            const storageData = JSON.stringify(
                credentials satisfies StorageData,
            );
            if (
                !(
                    localStorage["demo-auth-existing-users"]?.split(",") as
                        | string[]
                        | undefined
                )?.includes(name)
            ) {
                localStorage["demo-auth-existing-users"] = localStorage[
                    "demo-auth-existing-users"
                ]
                    ? localStorage["demo-auth-existing-users"] + "," + name
                    : name;
            }
            localStorage["demo-auth-existing-users-" + name] = storageData;
        }
    }

    async createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        crypto: CryptoProvider,
    ): Promise<Acc> {
        if (localStorage["demo-auth-logged-in-secret"]) {
            const localStorageData = JSON.parse(
                localStorage[localStorageKey],
            ) as StorageData;

            const sessionID = await getSessionFor(localStorageData.accountID);

            const account = (await this.accountSchema.become({
                accountID: localStorageData.accountID as ID<Acc>,
                accountSecret: localStorageData.accountSecret,
                sessionID,
                peersToLoadFrom: initialPeers,
                crypto,
            })) as Acc;

            this.driver.onSignedIn({ logOut });
            return Promise.resolve(account);
        } else {
            return new Promise<Acc>((resolveAccount) => {
                this.driver.onReady({
                    signUp: async (username) => {
                        const account = (await this.accountSchema.create({
                            creationProps: { name: username },
                            peersToLoadFrom: initialPeers,
                            crypto,
                        })) as Acc;
                        if (!isControlledAccount(account)) {
                            throw "account is not a controlled account";
                        }

                        const storageData = JSON.stringify({
                            accountID: account.id,
                            accountSecret: account._raw.agentSecret,
                        } satisfies StorageData);

                        localStorage["demo-auth-logged-in-secret"] =
                            storageData;
                        localStorage["demo-auth-existing-users-" + username] =
                            storageData;

                        localStorage["demo-auth-existing-users"] = localStorage[
                            "demo-auth-existing-users"
                        ]
                            ? localStorage["demo-auth-existing-users"] +
                              "," +
                              username
                            : username;

                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                    existingUsers:
                        localStorage["demo-auth-existing-users"]?.split(",") ??
                        [],
                    logInAs: async (existingUser) => {
                        const storageData = JSON.parse(
                            localStorage[
                                "demo-auth-existing-users-" + existingUser
                            ],
                        ) as StorageData;

                        localStorage["demo-auth-logged-in-secret"] =
                            JSON.stringify(storageData);

                        const account = (await this.accountSchema.become({
                            accountID: storageData.accountID as ID<Acc>,
                            accountSecret: storageData.accountSecret,
                            sessionID: await getSessionFor(
                                storageData.accountID,
                            ),
                            peersToLoadFrom: initialPeers,
                            crypto,
                        })) as Acc;

                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                });
            });
        }
    }
}

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserDemoAuth {
    export interface Driver {
        onReady: (next: {
            signUp: (username: string) => Promise<void>;
            existingUsers: string[];
            logInAs: (existingUser: string) => Promise<void>;
        }) => void;
        onSignedIn: (next: { logOut: () => void }) => void;
    }
}

function logOut() {
    delete localStorage[localStorageKey];
}
