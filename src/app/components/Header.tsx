import styles from './Header.module.css';

interface HeaderProps {
    isLoggedIn: boolean;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    userEmail?: string;
}

export default function Header({ isLoggedIn, onLoginClick, onLogoutClick, userEmail }: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.content}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Financial Overview</h1>
                    <p className={styles.subtitle}>Track your spending and stay within budget</p>
                </div>

                <div className={styles.actions}>
                    {isLoggedIn ? (
                        <div className={styles.userInfo}>
                            <span className={styles.email}>{userEmail}</span>
                            <button className={styles.authButton} onClick={onLogoutClick}>Logout</button>
                        </div>
                    ) : (
                        <button className={styles.authButton} onClick={onLoginClick}>Login</button>
                    )}
                </div>
            </div>
        </header>
    );
}
