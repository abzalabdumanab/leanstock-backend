const { processOneEmailJob } = require("../services/email.service");

function startEmailWorker() {
  const timer = setInterval(async () => {
    try {
      await processOneEmailJob();
    } catch (error) {
      console.error("Email worker failed:", error.message);
    }
  }, 5000);

  return timer;
}

module.exports = { startEmailWorker };
