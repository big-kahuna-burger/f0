-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "cookieKeys" TEXT[] DEFAULT ARRAY['cookie-secret-123456']::TEXT[];
