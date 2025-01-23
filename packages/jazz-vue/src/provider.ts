import { JazzContextManager } from "jazz-browser";
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
import { useIsAnonymousUser } from "./auth/useIsAnonymousUser.js";

export const logoutHandler = ref<() => void>();

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export const JazzContextSymbol = Symbol("JazzContext");

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
  },
  setup(props, { slots }) {
    const contextManager = new JazzContextManager<RegisteredAccount>();
    const ctx = ref<JazzContextType<RegisteredAccount>>();

    provide(JazzContextSymbol, ctx);

    const isAnonymousUser = useIsAnonymousUser();

    const localOnly = computed(() =>
      props.localOnly === "anonymous"
        ? isAnonymousUser.value
        : props.localOnly === "always",
    );

    watch(
      () => ({
        peer: props.peer,
        storage: props.storage,
      }),
      async () => {
        contextManager
          .createContext({
            peer: props.peer,
            storage: props.storage,
            guestMode: props.guestMode,
            AccountSchema: props.AccountSchema,
            localOnly: localOnly.value,
          })
          .catch((error) => {
            console.error("Error creating Jazz browser context:", error);
          });
      },
      { immediate: true },
    );

    watch(localOnly, (newLocalOnly) => {
      contextManager.toggleNetwork(!newLocalOnly);
    });

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
