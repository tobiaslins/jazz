import { JazzBrowserContextManager } from "jazz-browser";
import { Account, AccountClass, JazzContextType } from "jazz-tools";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PropType,
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
} from "vue";

export const logoutHandler = ref<() => void>();

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export const JazzContextSymbol = Symbol("JazzContext");
export const JazzAuthContextSymbol = Symbol("JazzAuthContext");
export const JazzProvider = defineComponent({
  name: "JazzProvider",
  props: {
    guestMode: {
      type: Boolean,
      default: false,
    },
    localOnly: {
      type: String as PropType<"always" | "anonymous" | "off">,
      default: "off",
    },
    AccountSchema: {
      type: Function as unknown as PropType<AccountClass<RegisteredAccount>>,
      required: false,
    },
    peer: {
      type: String as PropType<`wss://${string}` | `ws://${string}`>,
      required: true,
    },
    storage: {
      type: String as PropType<"indexedDB" | "singleTabOPFS">,
      default: undefined,
    },
    defaultProfileName: {
      type: String,
      required: false,
    },
  },
  setup(props, { slots }) {
    const contextManager = new JazzBrowserContextManager<RegisteredAccount>();
    const ctx = ref<JazzContextType<RegisteredAccount>>();

    provide(JazzContextSymbol, ctx);
    provide(JazzAuthContextSymbol, contextManager.getAuthSecretStorage());

    watch(
      () => ({
        peer: props.peer,
        storage: props.storage,
        guestMode: props.guestMode,
      }),
      async () => {
        contextManager
          .createContext({
            peer: props.peer,
            storage: props.storage,
            guestMode: props.guestMode,
            AccountSchema: props.AccountSchema,
            localOnly: props.localOnly,
            defaultProfileName: props.defaultProfileName,
          })
          .catch((error) => {
            console.error("Error creating Jazz browser context:", error);
          });
      },
      { immediate: true },
    );

    onMounted(() => {
      const cleanup = contextManager.subscribe(() => {
        ctx.value = contextManager.getCurrentValue();
      });
      onUnmounted(cleanup);
    });

    onUnmounted(() => {
      if (ctx.value) ctx.value.done?.();
    });

    return () => (ctx.value ? slots.default?.() : null);
  },
});
