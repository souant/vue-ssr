const { defineConfig } = require("@vue/cli-service");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
// 客户端渲染包构建插件
const VueSSRClientPlugin = require("vue-server-renderer/client-plugin");
// 服务端渲染包构建插件
const VueSSRServerPlugin = require("vue-server-renderer/server-plugin");

// 判断是否服务端渲染打包
const isTargetNode = process.env.TARGET_ENV === "node";
const target = isTargetNode ? "server" : "client";

module.exports = defineConfig({
  transpileDependencies: true,
  // runtimeCompiler: true,
  publicPath: "/dist/",
  // productionSourceMap: true,
  // assetsDir: "static",
  lintOnSave: true,
  css: {
    // 不抽离css
    extract: true,
    // 开启sourceMap，解决服务端渲染报错TypeError: Cannot read properties of undefined (reading 'replace') vue-server-renderer\build.prod.js
    sourceMap: true,
  },
  configureWebpack: {
    entry: `./src/entry-${target}.js`,
    target: isTargetNode ? "node" : "web",
    node: isTargetNode ? {} : false,
    // 对 bundle renderer 提供 source map 支持
    devtool: "source-map",
    output: {
      filename: "[name].[chunkhash].js",
      // 服务端node环境打包为comminjs包
      libraryTarget: isTargetNode ? "commonjs2" : undefined,
    },
    // https://webpack.js.org/configuration/externals/#function
    // https://github.com/liady/webpack-node-externals
    // 外置化应用程序依赖模块。可以使服务器构建速度更快，
    // 并生成较小的 bundle 文件。
    externals: isTargetNode
      ? nodeExternals({
          // 不要外置化 webpack 需要处理的依赖模块。
          // 你可以在这里添加更多的文件类型。例如，未处理 *.vue 原始文件，
          // 你还应该将修改 `global`（例如 polyfill）的依赖模块列入白名单
          allowlist: [/\.css$/, /\?vue&type=style/],
        })
      : undefined,
    plugins: isTargetNode
      ? [
          new VueSSRServerPlugin(),
          new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
          }),
        ]
      : [new VueSSRClientPlugin()],
  },
  chainWebpack(config) {
    // 服务端构建配置
    if (isTargetNode) {
      // 删除热更新
      config.plugins.delete("hmr"); // fix ssr hot update bug
      // 服务端不分包
      config.optimization.splitChunks(undefined);
    }
    config.plugins.delete("friendly-errors");
    // 删除 HTML 相关的 webpack 插件
    config.plugins.delete("html");
    config.plugins.delete("preload");
    config.plugins.delete("prefetch");
  },
});
