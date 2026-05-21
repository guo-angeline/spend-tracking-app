-- Add monthlyBudget to User with default 4500
ALTER TABLE "User" ADD COLUMN "monthlyBudget" DOUBLE PRECISION NOT NULL DEFAULT 4500;

-- Add syncCursor to BankItem for incremental Plaid sync
ALTER TABLE "BankItem" ADD COLUMN "syncCursor" TEXT;

-- Remove default value from password field (passwords must now be explicitly set)
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
