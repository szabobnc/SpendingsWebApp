import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useState } from "react";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory"; 

function Layout({ onAddTransaction, showTransaction, setShowTransaction, editingTransaction, setEditingTransaction }) {
    const { logout } = useAuth();
    const [showCategory, setShowCategory] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <div className="navbar">
                <nav onClick={() => navigate("/main")}>Home</nav>
                <nav onClick={() => {
                    setEditingTransaction(null);
                    setShowTransaction(true);
                }}>Add new transaction</nav>
                <nav><Link to="/main">Add new saving goal</Link></nav>
                <nav onClick={() => setShowCategory(true)}>Add new category</nav>
                <button onClick={logout}>Logout</button>
                <Outlet />
            </div>

            {showTransaction && (
                <NewTransaction
                    onClose={() => setShowTransaction(false)}
                    onAdd={onAddTransaction}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={setEditingTransaction}
                />
            )}

            {showCategory && (
                <NewCategory onClose={() => setShowCategory(false)} />
            )}
        </>
    );
}

export default Layout;
