import { DemoAuthBasicUI, JazzProvider, useDemoAuth } from "jazz-vue";
import { createApp, defineComponent, h } from "vue";
import App from "./App.vue";
import "./index.css";
import router from "./router";

const AuthScreen = defineComponent({
  name: "AuthScreen",
  setup() {
    const auth = useDemoAuth();

    return () => [
      auth.value.state === "anonymous"
        ? h(DemoAuthBasicUI, {
            appName: "Jazz Vue Chat",
            auth,
          })
        : h(App),
    ];
  },
});

const RootComponent = defineComponent({
  name: "RootComponent",
  setup() {
    return () =>
      h(
        JazzProvider,
        {
          peer: "wss://cloud.jazz.tools/?key=vue-chat-example-jazz@garden.co",
        },
        {
          default: () => h(AuthScreen),
        },
      );
  },
});

const app = createApp(RootComponent);

app.use(router);

app.mount("#app");
