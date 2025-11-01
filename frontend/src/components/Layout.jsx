import { Link, Outlet } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useState } from "react";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory"; 

function Layout({ onAddTransaction, showTransaction, setShowTransaction, editingTransaction, setEditingTransaction }) {
    const { logout } = useAuth();
    const [showCategory, setShowCategory] = useState(false);

    // Provide default functions if not passed as props
    const handleSetEditingTransaction = setEditingTransaction || (() => {});
    const handleSetShowTransaction = setShowTransaction || (() => {});

    return (
        <>
            <div className="navbar">
                <nav><Link to="/main">Transactions</Link></nav>
                <nav onClick={() => {
                    handleSetEditingTransaction(null);
                    handleSetShowTransaction(true);
                }}>Add new transaction</nav>
                <nav><Link to="/main">Add new saving goal</Link></nav>
                <nav onClick={() => setShowCategory(true)}>Add new category</nav>
                <nav><Link to="/account">Account</Link></nav>
                <nav><Link to="">Set new limit</Link></nav>
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
        </>
    );
}

export default Layout;