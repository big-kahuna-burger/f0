-- AlterTable
ALTER TABLE "client_connection" ADD COLUMN     "readonly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "connection" ADD COLUMN     "readonly" BOOLEAN NOT NULL DEFAULT false;
