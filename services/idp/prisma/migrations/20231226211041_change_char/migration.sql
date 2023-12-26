/*
  Warnings:

  - You are about to alter the column `signingSecret` on the `resource_server` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Char(32)`.

*/
-- AlterTable
ALTER TABLE "resource_server" ALTER COLUMN "signingSecret" SET DATA TYPE CHAR(32);
