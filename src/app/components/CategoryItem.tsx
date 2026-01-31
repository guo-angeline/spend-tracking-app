import ProgressBar from './ProgressBar';
import { LucideIcon } from 'lucide-react';
import styles from './CategoryItem.module.css';

interface CategoryItemProps {
    icon: LucideIcon | string;
    name: string;
    spent: number;
    limit: number;
    color?: string;
}

export default function CategoryItem({
    icon: Icon,
    name,
    spent,
    limit,
    color
}: CategoryItemProps) {
    const percentage = Math.min((spent / limit) * 100, 100);
    const leftAmount = Math.max(limit - spent, 0);

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper} style={{ color }}>
                {typeof Icon === 'string' ? (
                    <span style={{ fontSize: '20px' }}>{Icon}</span>
                ) : (
                    <Icon size={24} />
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.nameGroup}>
                        <span className={styles.name}>{name}</span>
                        <div className={styles.amounts}>
                            <span className={styles.current}>${spent.toFixed(2)}</span>
                            of ${limit.toFixed(2)}
                        </div>
                    </div>
                </div>

                <ProgressBar value={spent} max={limit} color={color} height="10px" />

                <div className={styles.footer}>
                    <span>{percentage.toFixed(1)}%</span>
                    <span>${limit.toFixed(2)}</span>
                </div>
            </div>

            <div className={styles.rightAmount}>
                <span className={styles.rightLeft}>${leftAmount.toFixed(2)}</span>
                <span className={styles.rightLabel}>left</span>
            </div>
        </div>
    );
}
