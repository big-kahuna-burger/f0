-- CreateTable
CREATE TABLE "password_hash" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "identityId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_hash_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "password_hash" ADD CONSTRAINT "password_hash_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "identity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
