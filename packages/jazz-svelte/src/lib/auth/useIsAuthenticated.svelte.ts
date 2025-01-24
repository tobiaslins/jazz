import { AuthSecretStorage } from "jazz-browser";
import { onDestroy } from "svelte";

export function useIsAuthenticated() {
    let isAuthenticated = $state(AuthSecretStorage.isAuthenticated());

    const unsubscribe = AuthSecretStorage.onUpdate(() => {
        isAuthenticated = AuthSecretStorage.isAuthenticated();
    });

    onDestroy(() => {
        unsubscribe();
    });

    return {
        get value() {
            return isAuthenticated;
        }
    };
}