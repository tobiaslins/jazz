import { AuthSecretStorage } from "jazz-browser";
import { onMounted, onUnmounted, ref } from "vue";

export function useIsAuthenticated() {
  const isAuthenticated = ref(AuthSecretStorage.isAuthenticated());

  const handleUpdate = () => {
    isAuthenticated.value = AuthSecretStorage.isAuthenticated();
  };

  onMounted(() => {
    const cleanup = AuthSecretStorage.onUpdate(handleUpdate);
    onUnmounted(cleanup);
  });

  return isAuthenticated;
}
