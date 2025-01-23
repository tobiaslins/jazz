import { AuthSecretStorage } from "jazz-browser";
import { onMounted, onUnmounted, ref } from "vue";

export function useIsAnonymousUser() {
  const isAnonymous = ref(AuthSecretStorage.isAnonymous());

  const handleUpdate = () => {
    isAnonymous.value = AuthSecretStorage.isAnonymous();
  };

  onMounted(() => {
    const cleanup = AuthSecretStorage.onUpdate(handleUpdate);
    onUnmounted(cleanup);
  });

  return isAnonymous;
}
