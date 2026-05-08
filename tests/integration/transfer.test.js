// Түсіндірме: request модулін осы файлда қолдану үшін жүктейді.
const request = require("supertest");
// Түсіндірме: createApp модулін осы файлда қолдану үшін жүктейді.
const createApp = require("../../src/app");
// Түсіндірме: { prisma } модулін осы файлда қолдану үшін жүктейді.
const { prisma } = require("../../src/config/database");

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const app = createApp();

// Түсіндірме: Асинхронды операция орындайтын функцияны анықтайды.
async function setupTenant() {
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.revokedRefreshToken.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.transferItem.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.transfer.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.stockEntry.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.productVariant.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.product.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.warehouse.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.user.deleteMany();
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.tenant.deleteMany();

  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const registered = await request(app)
    // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
    .post("/api/v1/auth/register")
    // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
    .send({ tenantName: "Arzan Shop", email: "owner@arzan.kz", password: "Secure!Pass99" })
    // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
    .expect(201);

  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const token = registered.body.tokens.accessToken;
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const tenantId = registered.body.user.tenantId;
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const source = await prisma.warehouse.create({ data: { tenantId, name: "Source" } });
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const destination = await prisma.warehouse.create({ data: { tenantId, name: "Destination" } });
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const product = await prisma.product.create({ data: { tenantId, name: "Sneakers", baseUnit: "pcs" } });
  // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
  const variant = await prisma.productVariant.create({
    // Түсіндірме: Код блогын немесе объект құрылымын бастайды.
    data: {
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      tenantId,
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      productId: product.id,
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      sku: "SHOE-BLK-42",
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      costPrice: 2500,
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      retailPrice: 5990,
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      currentPrice: 5990,
      // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
      liquidationPrice: 1500
    // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
    }
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });
  // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
  await prisma.stockEntry.create({
    // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
    data: { tenantId, variantId: variant.id, warehouseId: source.id, quantity: 10 }
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });
  // Түсіндірме: Функциядан нәтижені қайтарады.
  return { token, source, destination, variant };
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
}

// Түсіндірме: Jest тесттерінің тобын сипаттайды.
describe("inventory transfer transaction", () => {
  // Түсіндірме: Тесттерден кейін орындалатын тазалау қадамын анықтайды.
  afterAll(async () => {
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.$disconnect();
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });

  // Түсіндірме: Нақты бір тест сценарийін анықтайды.
  test("overselling is impossible and stock remains unchanged on failure", async () => {
    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const { token, source, destination, variant } = await setupTenant();

    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/transfers")
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .set("Authorization", `Bearer ${token}`)
      // Түсіндірме: Код блогын немесе объект құрылымын бастайды.
      .send({
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        sourceId: source.id,
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        destinationId: destination.id,
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        items: [{ variantId: variant.id, quantity: 99 }]
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(409);

    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const stock = await prisma.stockEntry.findFirst({ where: { variantId: variant.id, warehouseId: source.id } });
    // Түсіндірме: Тест нәтижесі күтілген мәнге сәйкес екенін тексереді.
    expect(stock.quantity).toBe(10);
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
});
