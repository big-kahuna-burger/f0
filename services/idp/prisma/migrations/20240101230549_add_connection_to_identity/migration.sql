/*
  Warnings:

  - Added the required column `connectionId` to the `identity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "identity" ADD COLUMN     "connectionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
