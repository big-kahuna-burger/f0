-- CreateTable
CREATE TABLE "oidc_client" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readonly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_client_pkey" PRIMARY KEY ("id")
);
