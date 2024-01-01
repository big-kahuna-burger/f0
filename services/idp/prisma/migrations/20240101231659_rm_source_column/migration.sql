/*
  Warnings:

  - You are about to drop the column `source` on the `identity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "identity" DROP COLUMN "source";

-- DropEnum
DROP TYPE "IDENTITY";
