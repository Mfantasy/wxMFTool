import { renderToString } from 'vue/server-renderer';
import { createSSRApp } from 'vue'
import path from "path";
import { fileURLToPath } from 'url';
const __filenameNew = fileURLToPath(import.meta.url)
import express from "express";
import cors from "cors";
import morgan from "morgan";
import imgs from "./b64img";

import {  init as initDB, Counter } from "./db.js";

const logger = morgan("tiny");
const __dirname = path.dirname(__filenameNew);

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

app.get("/api/whqf", async (req, res) => {
  res.send({ name: 'whqf', value: "芜湖起飞" });
});

app.get("/api/photos", async (req, res) => {
  let id = Number(req.params.id);
  if(!id) id=0;
  res.send(imgs[id]);
});

app.get("/api/vue", async (req, res) => {
  const createApp = () => {
    return createSSRApp({
      data: () => ({ count: 1 }),
      template: `<div style='background-color:red;width:500px;height:500px;' @click="count--"><button @click="count++">{{ count }}</button></div><button @click="count++">{{ count }}</button>`
    })
  };
  const app = createApp();
  renderToString(app).then((html) => {
    res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Vue SSR Example</title>
      <script type="importmap">
        {
          "imports": {
            "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
          }
        }
      </script>
      <script type="module">
      import { createSSRApp } from 'vue'
createSSRApp({
  data: () => ({ count: 1 }),
  template: '<div style="background-color:red;width:500px;height:500px;" @click="count--"><button @click="count++">{{ count }}</button></div><button @click="count++">{{ count }}</button>'
}).mount('#app');
console.log('1234');
      </script>
    </head>
    <body>
      <div id="app">${html}</div>
    </body>
  </html>
  `);
  });
});

app.post("/api/whqf", async (req, res) => {
  const { action, foo } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  else {
    await Counter.create({ count: Number(action) || 80, foo: foo });
  }
  res.send({
    code: 323,
    data: await Counter.findAll(),
  });
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
