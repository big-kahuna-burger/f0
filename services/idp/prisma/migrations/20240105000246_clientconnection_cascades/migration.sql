-- DropForeignKey
ALTER TABLE "client_connection" DROP CONSTRAINT "client_connection_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_connection" DROP CONSTRAINT "client_connection_connectionId_fkey";

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oidc_client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_connection" ADD CONSTRAINT "client_connection_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
