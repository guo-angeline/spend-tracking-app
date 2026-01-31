-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "authProviderId" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'password',
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("authProviderId", "createdAt", "email", "id", "name", "updatedAt") SELECT "authProviderId", "createdAt", "email", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_authProviderId_key" ON "User"("authProviderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
