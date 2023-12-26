/*
  Warnings:

  - The `scopes` column on the `resource_server` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "resource_server" DROP COLUMN "scopes",
ADD COLUMN     "scopes" JSONB[];
