/*
  Warnings:

  - A unique constraint covering the columns `[identifier]` on the table `resource_server` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `identifier` to the `resource_server` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "resource_server" ADD COLUMN     "identifier" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "resource_server_identifier_key" ON "resource_server"("identifier");
