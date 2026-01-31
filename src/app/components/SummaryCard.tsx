import styles from './SummaryCard.module.css';
import ProgressBar from './ProgressBar';

interface SummaryCardProps {
    title: string;
    amount: string;
    subtitle?: string;
    progress?: number; // 0 to 100
    totalBudgetLabel?: string; // e.g. "$4,500 monthly budget"
    badge?: {
        text: string;
        trend: 'up' | 'down';
    };
    showProgress?: boolean;
}

export default function SummaryCard({
    title,
    amount,
    subtitle,
    progress = 0,
    totalBudgetLabel,
    badge,
    showProgress = true
}: SummaryCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                {badge && (
                    <span className={`${styles.badge} ${styles[badge.trend]}`}>
                        {badge.trend === 'up' ? '↗' : '↘'} {badge.text}
                    </span>
                )}
            </div>

            <div className={styles.amount}>{amount}</div>

            <div className={styles.footer}>
                {showProgress && <ProgressBar value={progress} max={100} height="6px" />}
                <div className={styles.meta}>
                    {totalBudgetLabel && <div className={styles.budget}>{totalBudgetLabel}</div>}
                    {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
                </div>
            </div>
        </div>
    );
}
