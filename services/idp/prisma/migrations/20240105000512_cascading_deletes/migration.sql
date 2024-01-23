-- DropForeignKey
ALTER TABLE "identity" DROP CONSTRAINT "identity_connectionId_fkey";

-- DropForeignKey
ALTER TABLE "identity" DROP CONSTRAINT "identity_sub_fkey";

-- DropForeignKey
ALTER TABLE "login" DROP CONSTRAINT "login_sub_fkey";

-- DropForeignKey
ALTER TABLE "password_hash" DROP CONSTRAINT "password_hash_identityId_fkey";

-- AddForeignKey
ALTER TABLE "login" ADD CONSTRAINT "login_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_sub_fkey" FOREIGN KEY ("sub") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity" ADD CONSTRAINT "identity_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_hash" ADD CONSTRAINT "password_hash_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
