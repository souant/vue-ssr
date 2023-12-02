import { createApp } from "./app";

const { app, router, store } = createApp();

// 使用服务器初始化状态来准备存储。
// 状态在 SSR 期间确定并内联在页面标记中。
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__);
}

// 路由钩子完成后
router.onReady(() => {
  // 执行客户端渲染
  app.$mount("#app");
});
