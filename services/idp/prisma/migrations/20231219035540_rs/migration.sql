-- CreateEnum
CREATE TYPE "RS_SIGNING_ALG" AS ENUM ('RS256', 'HS256');

-- CreateTable
CREATE TABLE "resource_server" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "signingAlg" "RS_SIGNING_ALG" NOT NULL DEFAULT 'RS256',
    "scopes" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_server_pkey" PRIMARY KEY ("id")
);
