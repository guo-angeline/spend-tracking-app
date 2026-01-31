-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "accountId" TEXT,
    "plaidTransactionId" TEXT,
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "merchantName" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "plaidCategory" TEXT,
    "paymentChannel" TEXT,
    "location" TEXT,
    "authorizedDate" DATETIME,
    "isoCurrencyCode" TEXT,
    "personalFinanceCategory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpendCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "amount", "authorizedDate", "categoryId", "createdAt", "date", "description", "id", "isoCurrencyCode", "location", "logoUrl", "merchantName", "paymentChannel", "pending", "personalFinanceCategory", "plaidCategory", "plaidTransactionId", "updatedAt", "userId", "website") SELECT "accountId", "amount", "authorizedDate", "categoryId", "createdAt", "date", "description", "id", "isoCurrencyCode", "location", "logoUrl", "merchantName", "paymentChannel", "pending", "personalFinanceCategory", "plaidCategory", "plaidTransactionId", "updatedAt", "userId", "website" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_plaidTransactionId_key" ON "Transaction"("plaidTransactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
