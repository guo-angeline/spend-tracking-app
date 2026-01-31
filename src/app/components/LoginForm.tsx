import styles from './LoginForm.module.css';

interface LoginFormProps {
    onLogin: () => void;
    onCancel: () => void;
}

export default function LoginForm({ onLogin, onCancel }: LoginFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.description}>Sign in to access your financial dashboard</p>

            <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    className={styles.input}
                    required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                    type="password"
                    id="password"
                    placeholder="........"
                    className={styles.input}
                    required
                />
            </div>

            <div className={styles.actions}>
                <button type="submit" className={styles.submitButton}>Sign in</button>
                <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}
