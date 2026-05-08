CREATE TABLE "ActiveRefreshToken" (
  "id" TEXT NOT NULL,
  "jti" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActiveRefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ActiveRefreshToken_jti_key" ON "ActiveRefreshToken"("jti");
CREATE INDEX "ActiveRefreshToken_userId_idx" ON "ActiveRefreshToken"("userId");
CREATE INDEX "ActiveRefreshToken_expiresAt_idx" ON "ActiveRefreshToken"("expiresAt");
