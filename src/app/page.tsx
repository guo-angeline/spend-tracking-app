"use client";

import { useState, useEffect, useCallback } from "react";
import { Preferences } from "@capacitor/preferences";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import SummaryCard from "./components/SummaryCard";
import CategoryList from "./components/CategoryList";
import PlaidLink from "./components/PlaidLink";
import MonthlyFinancialsChart from "./components/MonthlyFinancialsChart";
import MonthSelector from "./components/MonthSelector";
import TransactionModal from "./components/TransactionModal";
import ProfileDropdown from "./components/ProfileDropdown";
import CategoryDistributionChart from "./components/CategoryDistributionChart";
import InsightBox from "./components/InsightBox";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type AuthedUser = { id: string; email: string; name: string | null; authProviderId: string; monthlyBudget: number };

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const authHeaders = useCallback(
    (tok?: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${tok ?? token}`,
    }),
    [token]
  );

  useEffect(() => {
    const loadSession = async () => {
      const [{ value: savedToken }, { value: savedUser }] = await Promise.all([
        Preferences.get({ key: "app_token" }),
        Preferences.get({ key: "app_user" }),
      ]);
      if (savedToken && savedUser) {
        try {
          const userData: AuthedUser = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
        } catch {
          await Preferences.remove({ key: "app_token" });
          await Preferences.remove({ key: "app_user" });
        }
      }
    };
    loadSession();
  }, []);

  const fetchTransactions = useCallback(
    async (tok: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/transactions`, {
          headers: authHeaders(tok),
        });
        if (!res.ok) throw new Error("Failed to fetch transactions");
        setTransactions(await res.json());
      } catch (err) {
        console.error(err);
      }
    },
    [authHeaders]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      setCategories(await res.json());
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchTransactions(token);
      fetchCategories();
    }
  }, [token, user, fetchTransactions, fetchCategories]);

  const handleCategoryChange = async (transactionId: string, newCategoryId: string) => {
    const previousTransactions = [...transactions];
    setTransactions(
      transactions.map((tx) => {
        if (tx.id !== transactionId) return tx;
        return { ...tx, categoryId: newCategoryId, category: categories.find((c) => c.id === newCategoryId) };
      })
    );
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ categoryId: newCategoryId }),
      });
      if (!res.ok) throw new Error("Failed to update category");
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch (err) {
      console.error("Error updating category:", err);
      setTransactions(previousTransactions);
    }
  };

  const persistSession = async (tok: string, userData: AuthedUser) => {
    await Promise.all([
      Preferences.set({ key: "app_token", value: tok }),
      Preferences.set({ key: "app_user", value: JSON.stringify(userData) }),
    ]);
    setToken(tok);
    setUser(userData);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }
      const { token: tok, user: userData } = await res.json();
      await persistSession(tok, userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }
      const { token: tok, user: userData } = await res.json();
      await persistSession(tok, userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (transactionData: any) => {
    const res = await fetch(`${API_BASE}/api/transactions/manual`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(transactionData),
    });
    if (!res.ok) throw new Error("Failed to save transaction");
    await fetchTransactions(token!);
  };

  const handleDeleteAccount = async () => {
    if (!user || !token) return;
    const confirmed = window.confirm(
      "Are you absolutely sure you want to delete your account? This will permanently wipe all your bank connections and transaction history. This action cannot be undone."
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/user/delete`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      alert("Your account and all associated data have been permanently deleted.");
      await handleLogout();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await Promise.all([
      Preferences.remove({ key: "app_token" }),
      Preferences.remove({ key: "app_user" }),
    ]);
    setToken(null);
    setUser(null);
    setTransactions([]);
    setUsername("");
    setPassword("");
  };

  if (user && token) {
    const totalMonthlyBudget = user.monthlyBudget;

    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    const previousMonthDate = new Date(selectedDate);
    previousMonthDate.setMonth(selectedMonth - 1);
    const previousMonth = previousMonthDate.getMonth();
    const previousYear = previousMonthDate.getFullYear();

    const adjustedTransactions = getAdjustedTransactions(transactions);

    const currentMonthTransactions = adjustedTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getUTCMonth() === selectedMonth && txDate.getUTCFullYear() === selectedYear;
    });

    const lastMonthTransactions = adjustedTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getUTCMonth() === previousMonth && txDate.getUTCFullYear() === previousYear;
    });

    const totalSpentThisMonth = currentMonthTransactions.reduce((sum, tx) => {
      if (tx.type === "INCOME" || tx.type === "TRANSFER") return sum;
      if (tx.category?.name === "Income" || tx.category?.name === "Transfer") return sum;
      return sum + Number(tx.amount);
    }, 0);

    const totalSpentLastMonth = lastMonthTransactions.reduce((sum, tx) => {
      if (tx.type === "INCOME" || tx.type === "TRANSFER") return sum;
      if (tx.category?.name === "Income" || tx.category?.name === "Transfer") return sum;
      return sum + Number(tx.amount);
    }, 0);

    let trendBadge = null;
    if (totalSpentLastMonth > 0) {
      const change = ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100;
      trendBadge = {
        text: `${Math.abs(change).toFixed(1)}%`,
        trend: (change <= 0 ? "down" : "up") as "up" | "down",
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
              <PlaidLink token={token} onSuccess={() => fetchTransactions(token)} />
              <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg font-medium shadow-sm transition-all text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </button>
              <div className="h-8 w-px bg-gray-200 mx-1" />
              <ProfileDropdown
                userName={user.name ?? user.authProviderId}
                onLogout={handleLogout}
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
                <InsightBox token={token} selectedDate={selectedDate} />
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
                        <td className="px-6 py-4">{new Date(tx.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tx.logoUrl ? (
                              <img
                                src={tx.logoUrl}
                                alt={tx.merchantName || "Logo"}
                                className="w-8 h-8 rounded-full object-cover border border-gray-100 bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                {tx.category?.icon || "📄"}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{tx.merchantName || tx.description}</span>
                              {tx.merchantName && (
                                <span className="text-xs text-gray-400 font-normal">{tx.description}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={tx.categoryId || ""}
                            onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                            className="block w-full rounded-md border-gray-300 py-1.5 text-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-transparent"
                            style={{ color: tx.category?.color || "inherit", fontWeight: 500 }}
                          >
                            <option value="" disabled>
                              Select Category
                            </option>
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
          </main>

          <TransactionModal
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            onSave={handleSaveTransaction}
            categories={categories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {authMode === "login" ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="text-gray-500 mt-2">
            {authMode === "login" ? "Sign in to view your finances" : "Start tracking your money"}
          </p>
        </div>

        <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-5">
          {authMode === "register" && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. johndoe"
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
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (authMode === "login" ? "Signing in..." : "Creating account...") : authMode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {authMode === "login" ? (
            <>
              No account yet?{" "}
              <button
                onClick={() => { setAuthMode("register"); setError(""); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setAuthMode("login"); setError(""); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function getAdjustedTransactions(rawTransactions: any[]) {
  const adjusted = rawTransactions.map((t) => ({ ...t }));
  const refunds = adjusted.filter((t) => t.type === "REFUND");

  refunds.forEach((refund) => {
    const refundAmount = Number(refund.amount);
    const refundDate = new Date(refund.date);

    const candidateIndices = adjusted.reduce((indices: number[], tx, idx) => {
      if (
        tx.type !== "REFUND" &&
        tx.description === refund.description &&
        Number(tx.amount) > 0 &&
        new Date(tx.date) < refundDate
      ) {
        indices.push(idx);
      }
      return indices;
    }, []);

    candidateIndices.sort(
      (a, b) => new Date(adjusted[b].date).getTime() - new Date(adjusted[a].date).getTime()
    );

    if (candidateIndices.length > 0) {
      const targetIdx = candidateIndices[0];
      const targetTx = adjusted[targetIdx];
      adjusted[targetIdx] = { ...targetTx, amount: Number(targetTx.amount) + refundAmount };
    }
  });

  return adjusted.filter((t) => t.type !== "REFUND");
}
