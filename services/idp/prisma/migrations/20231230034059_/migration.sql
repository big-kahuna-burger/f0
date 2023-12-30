/*
  Warnings:

  - The primary key for the `client_connection` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "client_connection" DROP CONSTRAINT "client_connection_pkey",
ADD CONSTRAINT "client_connection_pkey" PRIMARY KEY ("clientId", "connectionId", "readonly");
