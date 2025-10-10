import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useState } from "react";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory"; 

function Layout({ onAddTransaction }) {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showTransaction, setShowTransaction] = useState(false);
    const [showCategory, setShowCategory] = useState(false);

    return (
        <>
            <div className="navbar">
                <nav onClick={() => setShowTransaction(true)}>Add new transaction</nav>
                <nav><Link to="/main">Add new saving goal</Link></nav>
                <nav onClick={() => setShowCategory(true)}>Add new category</nav>
                <button onClick={logout}>Logout</button>
                <Outlet />
            </div>

            {showTransaction && (
                <NewTransaction
                    onClose={() => setShowTransaction(false)}
                    onAdd={onAddTransaction} // pass the callback to NewTransaction
                />
            )}

            {showCategory && (
                <NewCategory onClose={() => setShowCategory(false)} />
            )}
        </>
    );
}

export default Layout;
