import { Link, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import ThemeToggle from './ThemeToggle';

function SimpleLayout({ children }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <>
            <div className="navbar">
                <ThemeToggle />
                <nav onClick={() => navigate("/main")}>Transactions</nav>
                <nav onClick={() => navigate("/account")}>Account</nav>
                <button className="logout" onClick={logout}>Logout</button>
            </div>
            <div className="content">
                {children}
            </div>
        </>
    );
}

export default SimpleLayout;