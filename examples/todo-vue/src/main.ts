import { DemoAuthBasicUI, JazzProvider, useDemoAuth } from "jazz-vue";
import { createApp, defineComponent, h } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import router from "./router";
import { ToDoAccount } from "./schema";

declare module "jazz-vue" {
  interface Register {
    Account: ToDoAccount;
  }
}

const RootComponent = defineComponent({
  name: "RootComponent",
  setup() {
    return () =>
      h(
        JazzProvider,
        {
          AccountSchema: ToDoAccount,
          peer: "wss://cloud.jazz.tools/?key=vue-todo-example-jazz@garden.co",
        },
        h(
          DemoAuthBasicUI,
          {
            appName: "Jazz Vue Todo",
          },
          {
            default: () => h(App),
          },
        ),
      );
  },
});

const app = createApp(RootComponent);

app.use(router);

app.mount("#app");
