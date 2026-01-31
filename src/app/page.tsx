"use client";

import { useState } from "react";
import SummaryCard from "./components/SummaryCard";
import CategoryList from "./components/CategoryList";
import PlaidLink from "./components/PlaidLink";
import MonthlyFinancialsChart from "./components/MonthlyFinancialsChart";
import MonthSelector from "./components/MonthSelector";
import TransactionModal from "./components/TransactionModal";
import ProfileDropdown from "./components/ProfileDropdown";
import CategoryDistributionChart from "./components/CategoryDistributionChart";
import InsightBox from "./components/InsightBox";



export default function Home() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);



  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleCategoryChange = async (transactionId: string, newCategoryId: string) => {
    // Optimistic update
    const previousTransactions = [...transactions];
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === transactionId) {
        const newCategory = categories.find(c => c.id === newCategoryId);
        return { ...tx, categoryId: newCategoryId, category: newCategory };
      }
      return tx;
    });
    setTransactions(updatedTransactions);

    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newCategoryId })
      });

      if (!res.ok) {
        throw new Error('Failed to update category');
      }
    } catch (err) {
      console.error("Error updating category:", err);
      // Revert on error
      setTransactions(previousTransactions);
      alert("Failed to update category. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      const userData = await res.json();
      setUser(userData);
      fetchTransactions(userData.id);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (transactionData: any) => {
    try {
      const res = await fetch("/api/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...transactionData,
          userId: user.id
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save transaction");
      }

      // Refresh transactions
      await fetchTransactions(user.id);

      // Optionally show success message
      // alert("Transaction added successfully");
    } catch (err: any) {
      console.error("Error saving transaction:", err);
      throw err; // Re-throw to let modal handle error display
    }
  };

  const handleDeleteAccount = async () => {

    if (!user) return;

    const confirmed = window.confirm(
      "Are you absolutely sure you want to delete your account? This will permanently wipe all your bank connections and transaction history. This action cannot be undone."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }

      alert("Your account and all associated data have been permanently deleted.");
      setUser(null);
      setTransactions([]);
      setUserId("");
      setPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (dbUserId: string) => {
    try {
      const res = await fetch(`/api/transactions?userId=${dbUserId}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
    }
  };


  // --- SMART REFUND LOGIC ---
  // Returns a list of transactions where "REFUND" items have been
  // "netted out" against their original expenses.
  const getAdjustedTransactions = (rawTransactions: any[]) => {
    // 1. Clone to avoid mutating state directly
    // Use deep clone if needed, but shallow with object spread should suffice for simple mutations
    const adjusted = rawTransactions.map(t => ({ ...t }));

    // 2. Identify Refunds
    const refunds = adjusted.filter(t => t.type === 'REFUND');

    // 3. Transactions that are NOT refunds (candidates to be reduced)
    // We will modify 'adjusted' in place, but we need to track indices or references.
    // Let's iterate refunds and find their match in 'adjusted'.

    refunds.forEach(refund => {
      const refundAmount = Number(refund.amount); // e.g. -233.35
      const refundDate = new Date(refund.date);

      // Find nearest previous expense from same merchant
      // Criteria:
      // - Same Description (Merchant)
      // - Date < Refund Date
      // - Type is EXPENSE
      // - Amount > 0

      // We search in 'adjusted' array to modify the target in place.
      // Filter for candidates
      const candidateIndices = adjusted.reduce((indices, tx, idx) => {
        if (tx.type !== 'REFUND' &&
          tx.description === refund.description &&
          Number(tx.amount) > 0 &&
          new Date(tx.date) < refundDate
        ) {
          indices.push(idx);
        }
        return indices;
      }, [] as number[]);

      // Sort candidates by date descending (closest to refund first)
      candidateIndices.sort((a: number, b: number) => {
        return new Date(adjusted[b].date).getTime() - new Date(adjusted[a].date).getTime();
      });

      // Pick the best match (most recent previous transaction)
      if (candidateIndices.length > 0) {
        const targetIdx = candidateIndices[0];
        const targetTx = adjusted[targetIdx];

        // Apply the refund (Netting it out)
        // Expense: 289.80
        // Refund: -233.35
        // Result: 56.45
        const originalAmount = Number(targetTx.amount);
        const newAmount = originalAmount + refundAmount;

        // Update the transaction
        adjusted[targetIdx] = {
          ...targetTx,
          amount: newAmount,
          // Optional: Tag it so we know it was adjusted
          notes: `Adjusted by refund of ${refundAmount} from ${new Date(refund.date).toLocaleDateString()}`
        };
      }
    });

    // 4. Return the list WITHOUT the refund objects themselves
    // (Since their value has been transferred to the original expense)
    return adjusted.filter(t => t.type !== 'REFUND');
  };

  if (user) {
    const totalMonthlyBudget = 4500;

    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    // Calculate previous month relative to selected date for trend comparison
    const previousMonthDate = new Date(selectedDate);
    previousMonthDate.setMonth(selectedMonth - 1);
    const previousMonth = previousMonthDate.getMonth();
    const previousYear = previousMonthDate.getFullYear();


    // Use Adjusted Transactions for ALL Charts/Summaries
    // This ensures refunds are backdated/netted against original expenses
    const adjustedTransactions = getAdjustedTransactions(transactions);

    const currentMonthTransactions = adjustedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      // Use getMonth/getFullYear which returns local time components, consistent with how dates are usually handled in JS for "current month" logic
      // Ideally we'd use strict UTC or local depending on app requirements, assuming standard Date objects here.
      // Given the original code used getUTCMonth, I will stick to UTC to be safe and consistent with previous logic if possible,
      // but standard Date object months are 0-indexed.
      return txDate.getUTCMonth() === selectedMonth && txDate.getUTCFullYear() === selectedYear;
    });

    const lastMonthTransactions = adjustedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getUTCMonth() === previousMonth && txDate.getUTCFullYear() === previousYear;
    });


    const totalSpentThisMonth = currentMonthTransactions.reduce((sum, tx) => {
      // Exclude Income and Transfers from "Spent" calculation
      if (tx.type === 'INCOME' || tx.type === 'TRANSFER') return sum;
      // Fallback for older data if necessary (though backfill should have handled it)
      if (tx.category?.name === 'Income' || tx.category?.name === 'Transfer') return sum;

      // Use Number() to respect sign (positive for debits, negative for credits/refunds)
      return sum + Number(tx.amount);
    }, 0);

    const totalSpentLastMonth = lastMonthTransactions.reduce((sum, tx) => {
      if (tx.type === 'INCOME' || tx.type === 'TRANSFER') return sum;
      if (tx.category?.name === 'Income' || tx.category?.name === 'Transfer') return sum;

      return sum + Number(tx.amount);
    }, 0);

    let trendBadge = null;
    if (totalSpentLastMonth > 0) {
      const change = ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100;
      trendBadge = {
        text: `${Math.abs(change).toFixed(1)}%`,
        trend: (change <= 0 ? 'down' : 'up') as 'up' | 'down'
      };
    }

    const remainingBudget = Math.max(totalMonthlyBudget - totalSpentThisMonth, 0);
    const spentPercentage = (totalSpentThisMonth / totalMonthlyBudget) * 100;
    const remainingPercentage = (remainingBudget / totalMonthlyBudget) * 100;

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
            <div className="flex items-center gap-4">
              <PlaidLink userId={user.id} onSuccess={() => fetchTransactions(user.id)} />
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg font-medium shadow-sm transition-all text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Transaction
              </button>
              <div className="h-8 w-px bg-gray-200 mx-1"></div>
              <ProfileDropdown
                userName={user.name}
                onLogout={() => {
                  setUser(null);
                  setTransactions([]);
                  setUserId("");
                  setPassword("");
                }}
                onDeleteAccount={handleDeleteAccount}
              />
            </div>
          </header>

          <main className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Monthly Overview</h2>
                  <p className="text-sm text-gray-500 mt-1">Track your spending and budget for the selected month</p>
                </div>
                <MonthSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
              </div>

              <div className="p-6 space-y-8">
                {user && (
                  <InsightBox userId={user.id} selectedDate={selectedDate} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SummaryCard
                    title="Total Spent"
                    amount={`$${totalSpentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    progress={spentPercentage}
                    subtitle={`${spentPercentage.toFixed(1)}% of monthly budget`}
                    badge={trendBadge || undefined}
                  />
                  <SummaryCard
                    title="Remaining Budget"
                    amount={`$${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    showProgress={false}
                    totalBudgetLabel={`$${totalMonthlyBudget.toLocaleString()} monthly budget`}
                    subtitle={`${remainingPercentage.toFixed(1)}% remaining`}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Category Distribution</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <CategoryDistributionChart transactions={currentMonthTransactions} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
                    <CategoryList transactions={currentMonthTransactions} />
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Monthly Financials</h2>
                <p className="text-sm text-gray-500 mt-1">Income vs Spending</p>
              </div>
              <div className="p-6">
                <MonthlyFinancialsChart transactions={adjustedTransactions} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Description</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tx.logoUrl ? (
                              <img
                                src={tx.logoUrl}
                                alt={tx.merchantName || "Logo"}
                                className="w-8 h-8 rounded-full object-cover border border-gray-100 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                {tx.category?.icon || "📄"}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {tx.merchantName || tx.description}
                              </span>
                              {tx.merchantName && (
                                <span className="text-xs text-gray-400 font-normal">
                                  {tx.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={tx.categoryId || ""}
                            onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                            className="block w-full rounded-md border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-transparent"
                            style={{
                              color: tx.category?.color || 'inherit',
                              fontWeight: 500
                            }}
                          >
                            <option value="" disabled>Select Category</option>
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          ${Number(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* End of Recent Transactions */}

          </main>

          <TransactionModal
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={handleSaveTransaction}
            categories={categories}
          />
        </div >
      </div >
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to view your finances</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. demo-user-123"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
