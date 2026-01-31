import CategoryItem from './CategoryItem';
import styles from './CategoryList.module.css';

interface CategoryListProps {
    transactions: any[];
}

const BUDGETS: Record<string, number> = {
    'Housing': 1500,
    'Food': 600,
    'Transportation': 300,
    'Entertainment': 200,
    'Utilities': 300,
    'Other': 500
};

export default function CategoryList({ transactions }: CategoryListProps) {
    // Group transactions by category name
    const categoryTotals = transactions.reduce((acc: any, tx: any) => {
        const categoryName = tx.category?.name || 'Other';
        // Only count expenses (assuming negative numbers or just all amounts are positive in this simple version)
        // If the app has income categories like "Salary", we should filter them out for spending charts.
        if (categoryName === 'Income' || categoryName === 'Credit Card Payment') return acc;

        if (!acc[categoryName]) {
            acc[categoryName] = {
                name: categoryName,
                spent: 0,
                icon: tx.category?.icon || '📦',
                color: tx.category?.color || 'var(--text-secondary)'
            };
        }
        acc[categoryName].spent += Math.abs(Number(tx.amount));
        return acc;
    }, {});

    const sortedCategories = Object.values(categoryTotals).sort((a: any, b: any) => b.spent - a.spent);

    return (
        <div className={styles.container}>
            {sortedCategories.map((cat: any, index: number) => (
                <CategoryItem
                    key={index}
                    icon={cat.icon}
                    name={cat.name}
                    spent={cat.spent}
                    limit={BUDGETS[cat.name] || 500}
                    color={cat.color}
                />
            ))}
            {sortedCategories.length === 0 && (
                <div className="py-8 text-center text-gray-500">No category data available.</div>
            )}
        </div>
    );
}
