const cron = require("node-cron");
const env = require("../config/env");
const { prisma } = require("../config/database");
const { applyDeadStockDecay } = require("../services/deadStock.service");

async function runOnce() {
  return applyDeadStockDecay(prisma, env.deadStock);
}

function startDeadStockDecayJob() {
  if (env.nodeEnv === "test") {
    return null;
  }

  return cron.schedule(env.deadStock.cron, async () => {
    try {
      const result = await runOnce();
      console.log(`Dead stock decay completed: ${result.updated}/${result.scanned} variants updated`);
    } catch (error) {
      console.error("Dead stock decay failed:", error.message);
    }
  });
}

module.exports = { startDeadStockDecayJob, runOnce };
