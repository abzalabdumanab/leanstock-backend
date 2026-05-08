const { prisma } = require("../src/config/database");

const emails = process.argv.slice(2);

async function main() {
  if (emails.length === 0) {
    return;
  }

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true }
  });

  await prisma.activeRefreshToken.deleteMany({
    where: { userId: { in: users.map((user) => user.id) } }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
