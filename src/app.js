import Vue from "vue";
import App from "./App.vue";
import { createStore } from "./store";
import { createRouter } from "./router";

// 工厂函数，用于创建一组新的 store、router、
// 每次调用时的应用程序实例（为每个 SSR 请求调用）
export function createApp() {
  // 创建 store and router
  const store = createStore();
  const router = createRouter();

  // 创建应用程序实例。
  // 这里我们将 router、store 和 ssr 上下文注入到所有子组件中，
  // 使它们可以作为 `this.$router` 和 `this.$store` 随处可用。
  const app = new Vue({
    router,
    store,
    render: (h) => h(App),
  });

  // 导出 app store router。
  // 请注意，不能在这$mount，需要取决于我们是在浏览器中还是在服务器上。
  return { app, router, store };
}
