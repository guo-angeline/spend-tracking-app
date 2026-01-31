"use client";

import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface Transaction {
    id: string;
    amount: number | string;
    category?: {
        name: string;
        color?: string;
    };
    type?: string;
}

interface CategoryDistributionChartProps {
    transactions: Transaction[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function CategoryDistributionChart({ transactions }: CategoryDistributionChartProps) {
    const data = useMemo(() => {
        const categoryMap: Record<string, { name: string; value: number; color?: string }> = {};
        let totalSpent = 0;

        transactions.forEach(tx => {
            // Filter out Income and Transfers
            if (tx.type === 'INCOME' || tx.type === 'TRANSFER') return;
            if (tx.category?.name === 'Income' || tx.category?.name === 'Transfer' || tx.category?.name === 'Credit Card Payment') return;

            // Use normal number to allow negative values (refunds) to subtract from total
            const amount = Number(tx.amount);
            const categoryName = tx.category?.name || 'Uncategorized';
            const categoryColor = tx.category?.color;

            if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = {
                    name: categoryName,
                    value: 0,
                    color: categoryColor
                };
            }

            categoryMap[categoryName].value += amount;
            totalSpent += amount;
        });

        const sortedData = Object.values(categoryMap)
            .sort((a, b) => b.value - a.value);

        return sortedData.map((item, index) => ({
            ...item,
            // Calculate percentage for display if needed, but Recharts handles pie slices
            percentage: totalSpent > 0 ? (item.value / totalSpent) * 100 : 0,
            fill: item.color || COLORS[index % COLORS.length]
        }));
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center text-gray-400">
                No spending data available
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                    <div className="font-semibold text-gray-900">{data.name}</div>
                    <div className="text-gray-600">
                        ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {data.percentage.toFixed(1)}% of total
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
