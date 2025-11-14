import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useState } from "react";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory"; 
import SetLimit from "./SetLimit";
import ThemeToggle from "./ThemeToggle";

function Layout({ onAddTransaction, showTransaction, setShowTransaction, editingTransaction, setEditingTransaction }) {
    const { logout, user } = useAuth();
    const [showCategory, setShowCategory] = useState(false);
    const [showLimit, setShowLimit] = useState(false);

    // Provide default functions if not passed as props
    const handleSetEditingTransaction = setEditingTransaction || (() => {});
    const handleSetShowTransaction = setShowTransaction || (() => {});
    const navigate = useNavigate();

    return (
        <>
            <div className="navbar">
                <ThemeToggle />
                <nav><Link to="/main">Transactions</Link></nav>
                <nav onClick={() => {
                    handleSetEditingTransaction(null);
                    handleSetShowTransaction(true);
                }}>Add Transaction</nav>
                <nav onClick={() => setShowCategory(true)}>Add Category</nav>
                <nav onClick={() => setShowLimit(true)}>Add Limit</nav>
                <nav><Link to="/savings-goals">Savings Goals</Link></nav>
                <nav><Link to="/account">Account</Link></nav>
                <button onClick={logout}>Logout</button>
                <Outlet />
            </div>

            {showTransaction && onAddTransaction && (
                <NewTransaction
                    onClose={() => handleSetShowTransaction(false)}
                    onAdd={onAddTransaction}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={handleSetEditingTransaction}
                />
            )}

            {showCategory && (
                <NewCategory onClose={() => setShowCategory(false)} />
            )}

            {showLimit && (
                <SetLimit onClose={() => setShowLimit(false)} />
            )}
        </>
    );
}

export default Layout;