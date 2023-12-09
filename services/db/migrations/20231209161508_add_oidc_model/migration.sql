-- CreateTable
CREATE TABLE "oidc_model" (
    "id" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "grantId" TEXT,
    "userCode" TEXT,
    "uid" TEXT,
    "expiresAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oidc_model_id_type_key" ON "oidc_model"("id", "type");
