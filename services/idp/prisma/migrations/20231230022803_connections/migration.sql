-- CreateTable
CREATE TABLE "connection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_connection" (
    "clientId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_connection_pkey" PRIMARY KEY ("clientId","connectionId")
);

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oidc_client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
