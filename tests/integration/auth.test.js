// Түсіндірме: request модулін осы файлда қолдану үшін жүктейді.
const request = require("supertest");
// Түсіндірме: bcrypt модулін осы файлда қолдану үшін жүктейді.
const bcrypt = require("bcryptjs");
// Түсіндірме: createApp модулін осы файлда қолдану үшін жүктейді.
const createApp = require("../../src/app");
// Түсіндірме: { prisma } модулін осы файлда қолдану үшін жүктейді.
const { prisma } = require("../../src/config/database");

// Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
const app = createApp();

// Түсіндірме: Jest тесттерінің тобын сипаттайды.
describe("auth and RBAC", () => {
  // Түсіндірме: Тесттер алдында орындалатын дайындық қадамын анықтайды.
  beforeEach(async () => {
    await prisma.activeRefreshToken.deleteMany();
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.revokedRefreshToken.deleteMany();
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.user.deleteMany();
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.tenant.deleteMany();
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });

  // Түсіндірме: Тесттерден кейін орындалатын тазалау қадамын анықтайды.
  afterAll(async () => {
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.$disconnect();
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });

  // Түсіндірме: Нақты бір тест сценарийін анықтайды.
  test("register, login, refresh and logout flow works", async () => {
    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const register = await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/register")
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ tenantName: "Arzan Shop", email: "owner@arzan.kz", password: "Secure!Pass99", role: "WAREHOUSE_MANAGER" })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(201);

    // Түсіндірме: Тест нәтижесі күтілген мәнге сәйкес екенін тексереді.
    expect(register.body.tokens.accessToken).toBeTruthy();
    // Түсіндірме: Тест нәтижесі күтілген мәнге сәйкес екенін тексереді.
    expect(register.body.tokens.refreshToken).toBeTruthy();
    expect(register.body.user.role).toBe("WAREHOUSE_MANAGER");

    await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: register.body.tokens.refreshToken })
      .expect(200);

    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const login = await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/login")
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ email: "owner@arzan.kz", password: "Secure!Pass99" })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(200);

    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "owner@arzan.kz", password: "Secure!Pass99" })
      .expect(409);

    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    const refreshed = await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/refresh")
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ refreshToken: login.body.tokens.refreshToken })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(200);

    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/logout")
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ refreshToken: refreshed.body.refreshToken })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe("Logged out successfully");
      });

    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/refresh")
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ refreshToken: refreshed.body.refreshToken })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(401);
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });

  // Түсіндірме: Нақты бір тест сценарийін анықтайды.
  test("protected endpoints reject missing token and wrong role returns 403", async () => {
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await request(app).get("/api/v1/products").expect(401);

    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const tenant = await prisma.tenant.create({ data: { name: "Tenant" } });
    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const passwordHash = await bcrypt.hash("Password123!", 12);
    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await prisma.user.create({
      // Түсіндірме: Код блогын немесе объект құрылымын бастайды.
      data: {
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        tenantId: tenant.id,
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        email: "analyst@arzan.kz",
        // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
        passwordHash,
        // Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
        role: "ANALYST"
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      }
    // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
    });

    // Түсіндірме: Айнымалыны жариялап, оған бастапқы мән береді.
    const login = await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/auth/login")
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ email: "analyst@arzan.kz", password: "Password123!" })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(200);

    // Түсіндірме: Асинхронды операцияның аяқталуын күтеді.
    await request(app)
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .post("/api/v1/products")
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .set("Authorization", `Bearer ${login.body.tokens.accessToken}`)
      // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
      .send({ name: "Sneakers", baseUnit: "pcs", variants: [{ sku: "SKU-1", costPrice: 1, retailPrice: 2, liquidationPrice: 1 }] })
      // Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
      .expect(403);
  // Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
  });
// Түсіндірме: Ашылған код блогын немесе өрнекті жабады.
});
