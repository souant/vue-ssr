import { createApp } from "./app";

// 导出服务端渲染函数,将由 `bundleRenderer` 调用。
// 这是我们执行数据预取以确定
// 我们的应用程序在实际渲染之前的状态。
// 由于数据获取是异步的，因此该函数应该
// 返回一个解析为应用程序实例的 Promise。
export default (context) => {
  return new Promise((resolve, reject) => {
    // 创建实例
    const { app, router, store } = createApp();

    const { url } = context;
    const { fullPath } = router.resolve(url).route;

    if (fullPath !== url) {
      return reject({ url: fullPath });
    }

    // 解析路由
    router.push(url);

    // 等待路由解析完成
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents();
      // 未匹配到路由
      if (!matchedComponents.length) {
        return reject({ code: 404 });
      }
      // 数据预取
      // 路由匹配的组件上调用 asyncData 钩子。
      // asyncData 钩子获取数据后执行服务端渲染
      Promise.all(
        matchedComponents.map(
          ({ asyncData }) =>
            asyncData &&
            asyncData({
              store,
              route: router.currentRoute,
            })
        )
      )
        .then(() => {
          // 在所有 asyncData 钩子都解析之后
          // 暴露渲染上下文的状态，执行写入script window.__INITIAL_STATE__
          // 客户端可以获取到服务端已获取的状态
          context.state = store.state;
          // 返回服务端渲染app
          resolve(app);
        })
        .catch(reject);
    }, reject);
  });
};
