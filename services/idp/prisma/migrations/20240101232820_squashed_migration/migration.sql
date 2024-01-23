-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "RS_SIGNING_ALG" AS ENUM ('RS256', 'HS256');

-- CreateEnum
CREATE TYPE "CONNECTION_TYPE" AS ENUM ('DB');

-- CreateEnum
CREATE TYPE "AMR" AS ENUM ('PWD', 'PASSKEY');

-- CreateTable
CREATE TABLE "Config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jwks" JSONB[],
    "cookieKeys" TEXT[],
    "grantDebug" BOOLEAN DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
CREATE TABLE "oidc_client" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "connectionId" TEXT NOT NULL,

    CONSTRAINT "identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_hash" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "identityId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_hash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_server" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "signingAlg" "RS_SIGNING_ALG" NOT NULL DEFAULT 'RS256',
    "scopes" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ttl" INTEGER NOT NULL DEFAULT 86400,
    "ttlBrowser" INTEGER NOT NULL DEFAULT 7200,
    "allowSkipConsent" BOOLEAN NOT NULL DEFAULT false,
    "readOnly" BOOLEAN NOT NULL DEFAULT false,
    "signingSecret" CHAR(32),

    CONSTRAINT "resource_server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "CONNECTION_TYPE" NOT NULL DEFAULT 'DB',
    "readonly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_connection" (
    "clientId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readonly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "client_connection_pkey" PRIMARY KEY ("clientId","connectionId","readonly")
);

-- CreateIndex
CREATE UNIQUE INDEX "oidc_model_id_type_key" ON "oidc_model"("id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "profile_email_key" ON "profile"("email");

-- CreateIndex
CREATE INDEX "identity_sub_idx" ON "identity"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "resource_server_identifier_key" ON "resource_server"("identifier");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login" ADD CONSTRAINT "login_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_hash" ADD CONSTRAINT "password_hash_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oidc_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
