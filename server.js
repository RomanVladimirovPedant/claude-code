/**
 * Entry point for Passenger-based Node.js hosting (ISPmanager, cPanel и т.п.).
 * Такие панели запускают приложение командой `node server.js` и передают
 * порт/сокет через process.env.PORT — обычный `next start` тут не подходит,
 * поэтому оборачиваем Next.js в свой http-сервер.
 *
 * Локально используйте `npm run dev` / `npm run build && npm run start` —
 * этот файл нужен только на хостинге с Passenger.
 */
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Birthday Games listening on ${port}`);
  });
});
