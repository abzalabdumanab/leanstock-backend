const createApp = require("./app");
const env = require("./config/env");
const { disconnectPrisma } = require("./config/database");
const { disconnectRedis } = require("./config/redis");
const { startDeadStockDecayJob } = require("./jobs/deadStockDecay.job");
const { startEmailWorker } = require("./jobs/emailWorker.job");

const app = createApp();
const server = app.listen(env.port, () => {
  console.log(`LeanStock API running at http://localhost:${env.port}`);
  console.log(`Swagger UI available at http://localhost:${env.port}/docs`);
});

const deadStockTask = startDeadStockDecayJob();
const emailWorker = env.emailWorkerEnabled ? startEmailWorker() : null;

async function shutdown() {
  if (deadStockTask) deadStockTask.stop();
  if (emailWorker) clearInterval(emailWorker);
  server.close(async () => {
    await disconnectPrisma();
    await disconnectRedis();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
