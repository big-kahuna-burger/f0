-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "IDENTITY" AS ENUM ('DB', 'EXT');

-- CreateEnum
CREATE TYPE "AMR" AS ENUM ('PWD', 'PASSKEY');

-- CreateTable
CREATE TABLE "Config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jwks" JSONB[],
    "cookieKeys" TEXT[],

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "updatedAt" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthdate" DATE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "familyName" TEXT,
    "gender" TEXT,
    "givenName" TEXT,
    "locale" TEXT,
    "middleName" TEXT,
    "name" TEXT,
    "nickname" TEXT,
    "phoneNumber" TEXT,
    "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT false,
    "picture" TEXT,
    "preferredUsername" TEXT,
    "profile" TEXT,
    "updatedAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "website" TEXT,
    "zoneinfo" TEXT,
    "addressId" UUID,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formatted" TEXT,
    "streetAddress" TEXT,
    "locality" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "updatedAt" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loginTs" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "sub" TEXT NOT NULL,
    "method" "AMR" NOT NULL DEFAULT 'PWD',

    CONSTRAINT "login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sub" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "updatedAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "source" "IDENTITY" NOT NULL DEFAULT 'DB',

    CONSTRAINT "identity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oidc_model_id_type_key" ON "oidc_model"("id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "profile_email_key" ON "profile"("email");

-- CreateIndex
CREATE INDEX "identity_sub_idx" ON "identity"("sub");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login" ADD CONSTRAINT "login_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
