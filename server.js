/**
 * Entry point for panel-managed Node.js hosting (ISPmanager, cPanel/Passenger
 * и т.п.). Такие панели запускают приложение командой `node server.js` и
 * передают, куда слушать, через process.env.PORT — это может быть либо
 * номер TCP-порта, либо путь к unix-сокету (например ISPmanager проксирует
 * через `/var/www/<user>/data/nodejs/<n>.sock`). Обычный `next start`
 * unix-сокет не поддерживает, поэтому оборачиваем Next.js в свой http-сервер.
 *
 * Локально используйте `npm run dev` / `npm run build && npm run start` —
 * этот файл нужен только на хостинге с панелью.
 */
const { createServer } = require("http");
const next = require("next");
const fs = require("fs");

const rawTarget = process.env.PORT || "3000";
const isSocket = Number.isNaN(Number(rawTarget));
const listenTarget = isSocket ? rawTarget : Number(rawTarget);

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Убираем «зависший» файл сокета от предыдущего (упавшего) запуска —
  // иначе listen() упадёт с EADDRINUSE.
  if (isSocket && fs.existsSync(listenTarget)) {
    fs.unlinkSync(listenTarget);
  }

  const server = createServer((req, res) => handle(req, res));

  server.listen(listenTarget, () => {
    if (isSocket) {
      // Сокет должен быть доступен процессу nginx, который обычно
      // работает под другим системным пользователем.
      fs.chmodSync(listenTarget, 0o666);
    }
    console.log(`Birthday Games listening on ${listenTarget}`);
  });
});
