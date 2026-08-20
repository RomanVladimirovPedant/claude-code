/** @type {import('next').NextConfig} */
const nextConfig = {
  // Не используем standalone/serverless-вывод — трассировка файлов не нужна
  // и на некоторых VPS ломает сборку на шаге "Collecting build traces"
  // (ENOENT на *.nft.json).
  outputFileTracing: false,
};

module.exports = nextConfig;
