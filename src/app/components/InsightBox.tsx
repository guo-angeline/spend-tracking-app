"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface InsightBoxProps {
  token: string;
  selectedDate: Date;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function InsightBox({ token, selectedDate }: InsightBoxProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  useEffect(() => {
    if (!token) return;

    const fetchInsight = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/insights?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch insight");
        }
        const data = await res.json();
        setInsight(data.content);
      } catch (err: any) {
        setError(err.message || "Unable to generate insights at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [token, month, year]);

  if (!insight && !loading && !error) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm tracking-wide uppercase">AI Assistant</h3>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-gray-700">
            <p className="leading-relaxed text-[15px]">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
