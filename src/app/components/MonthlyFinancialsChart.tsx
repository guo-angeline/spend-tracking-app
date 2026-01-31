"use client";

import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface Transaction {
    id: string;
    amount: number | string;
    date: string | Date;
    type?: string;
    category?: {
        name: string;
    };
}

interface MonthlyFinancialsChartProps {
    transactions: Transaction[];
}

export default function MonthlyFinancialsChart({ transactions }: MonthlyFinancialsChartProps) {
    const data = useMemo(() => {
        const monthlyData: Record<string, { month: string; Income: number; Spent: number; sortKey: number }> = {};

        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthLabel,
                    Income: 0,
                    Spent: 0,
                    sortKey: date.getTime()
                };
            }

            const amount = Number(tx.amount);

            // Determine type: strict database type if present, else fallback to category
            if (tx.type === 'INCOME') {
                monthlyData[monthKey].Income += amount;
            } else if (tx.type === 'EXPENSE') {
                monthlyData[monthKey].Spent += amount;
            } else if (tx.type === 'TRANSFER') {
                // Ignore transfers
            } else {
                // Fallback logic if type field is missing in partial data scenarios
                if (tx.category?.name === 'Income') {
                    monthlyData[monthKey].Income += amount;
                } else if (tx.category?.name === 'Transfer') {
                    // Ignore transfers fallback
                } else {
                    monthlyData[monthKey].Spent += amount;
                }
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => a.sortKey - b.sortKey)
            // Take last 6 months to keep it clean, or all available? Let's show last 6 months.
            .slice(-6);
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-gray-400">
                No transaction data available
            </div>
        );
    }

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Spent" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
