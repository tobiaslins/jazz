import { AuthSecretStorage } from "jazz-browser";
import { onDestroy } from "svelte";

export function useIsAnonymousUser() {
    let isAnonymous = $state(AuthSecretStorage.isAnonymous());

    const unsubscribe = AuthSecretStorage.onUpdate(() => {
        isAnonymous = AuthSecretStorage.isAnonymous();
    });

    onDestroy(() => {
        unsubscribe();
    });

    return {
        get value() {
            return isAnonymous;
        }
    };
}