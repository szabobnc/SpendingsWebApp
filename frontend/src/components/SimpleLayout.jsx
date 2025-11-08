import { Link } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import ThemeToggle from './ThemeToggle';

function SimpleLayout({ children }) {
    const { logout } = useAuth();

    return (
        <>
            <div className="navbar">
                <nav><Link to="/main">Transactions</Link></nav>
                <nav><Link to="/account">Account</Link></nav>
                <ThemeToggle />
                <button onClick={logout}>Logout</button>
            </div>
            <div className="content">
                {children}
            </div>
        </>
    );
}

export default SimpleLayout;