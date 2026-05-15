const { enqueueEmail, processOneEmailJob } = require("../src/services/email.service");

async function main() {
  const to = process.argv[2];

  if (!to) {
    throw new Error("Usage: npm run email:test -- recipient@example.com");
  }

  const job = await enqueueEmail({
    tenantId: null,
    to,
    subject: "LeanStock SMTP test",
    template: "SMTP_TEST",
    payload: {
      heading: "LeanStock SMTP test",
      message: "If this message arrived, your local SMTP configuration works.",
      actionUrl: "http://localhost:3000/health"
    }
  });

  console.log(`Queued test email job ${job.id}`);
  const processed = await processOneEmailJob();
  console.log(JSON.stringify({
    id: processed?.id,
    to: processed?.to,
    status: processed?.status,
    attempts: processed?.attempts,
    lastError: processed?.lastError
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
