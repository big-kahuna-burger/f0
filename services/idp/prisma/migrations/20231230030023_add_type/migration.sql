-- CreateEnum
CREATE TYPE "CONNECTION_TYPE" AS ENUM ('DB');

-- AlterTable
ALTER TABLE "connection" ADD COLUMN     "type" "CONNECTION_TYPE" NOT NULL DEFAULT 'DB';
