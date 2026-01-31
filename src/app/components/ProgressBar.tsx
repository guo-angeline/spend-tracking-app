import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    max: number;
    color?: string;
    height?: string;
    showBackground?: boolean;
}

export default function ProgressBar({
    value,
    max,
    color = 'var(--accent-green)',
    height = '8px',
    showBackground = true
}: ProgressBarProps) {
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div
            className={styles.container}
            style={{
                height,
                backgroundColor: showBackground ? 'var(--border-color)' : 'transparent'
            }}
        >
            <div
                className={styles.fill}
                style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                }}
            />
        </div>
    );
}
