// Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
process.env.NODE_ENV = "test";
// Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://leanstock:leanstock@localhost:5432/leanstock_test?schema=public";
// Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-access-secret-test-access-secret";
// Түсіндірме: Осы жол ағымдағы логиканың бір қадамын орындайды.
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-test-refresh-secret";
// Түсіндірме: Объект, схема немесе конфигурация өрісін анықтайды.
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || "http://localhost:3000";
