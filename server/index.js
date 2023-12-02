const fs = require("fs");
const path = require("path");
const resolve = (file) => path.resolve(__dirname, file);

const express = require("express");
// 页面favicon
const favicon = require("serve-favicon");
const compression = require("compression");
// 服务端渲染函数
const { createBundleRenderer } = require("vue-server-renderer");

const app = express();
// 环境
const isProd = process.env.NODE_ENV === "production";
/**
 * 创建服务端渲染器
 * @param {*} bundle 服务端渲染包
 * @param {*} options 参数
 * @returns
 */
function createRenderer(bundle, options) {
  return createBundleRenderer(
    bundle,
    Object.assign(options, {
      // this is only needed when vue-server-renderer is npm-linked
      basedir: resolve("../dist"),
      // recommended for performance
      runInNewContext: false,
    })
  );
}

let renderer;
let readyPromise;
const templatePath = resolve("./index.template.html");
if (isProd) {
  // 在生产中：使用模板创建服务器渲染器并构建服务器包。
  // 服务器包由 vue-ssr-webpack-plugin 生成。
  const template = fs.readFileSync(templatePath, "utf-8");
  const bundle = require("../dist/vue-ssr-server-bundle.json");
  // 客户端清单是可选的，但它允许渲染器
  // 自动推断预加载/预取链接并直接添加 <script>
  // 渲染期间使用的任何异步块的标签，避免瀑布请求。
  const clientManifest = require("../dist/vue-ssr-client-manifest.json");
  renderer = createRenderer(bundle, {
    template,
    clientManifest,
  });
} else {
  // In development: setup the dev server with watch and hot-reload,
  // and create a new renderer on bundle / index template update.
  readyPromise = require("./setup-dev-server")(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createRenderer(bundle, options);
    }
  );
}

// 静态资源服务
const serve = (path, cache) =>
  express.static(resolve(path), {
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 * 30 : 0,
  });

app.use(compression({ threshold: 0 }));
app.use(favicon(resolve("../public/favicon.ico")));
app.use("/dist", serve("../dist", true));

// 请求渲染函数
function render(req, res) {
  const s = Date.now();

  res.setHeader("Content-Type", "text/html");

  const handleError = (err) => {
    if (err.url) {
      res.redirect(err.url);
    } else if (err.code === 404) {
      res.status(404).send("404 | Page Not Found");
    } else {
      // Render Error Page or Redirect
      res.status(500).send("500 | Internal Server Error");
      console.error(`error during render : ${req.url}`);
      console.error(err.stack);
    }
  };

  const context = {
    title: "Vue服务端渲染", // default title
    url: req.url,
  };
  renderer.renderToString(context, (err, html) => {
    if (err) {
      return handleError(err);
    }
    res.send(html);
    if (!isProd) {
      console.log(req.url);
      console.log(`请求用时: ${Date.now() - s}ms`);
    }
  });
}

app.get(
  "*",
  isProd
    ? render
    : (req, res) => {
        readyPromise.then(() => render(req, res));
      }
);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`server started at localhost:${port}`);
});
