-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "Config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jwks" JSONB[],

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);
