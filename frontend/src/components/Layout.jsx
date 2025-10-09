import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';
import { useState } from "react";
import NewTransaction from "./NewTransaction";

function Layout() {
    const { logout } = useAuth();
    const [showTransaction, setShowTransaction] = useState(false)

    return (
        <>
            <div className="navbar">
                <nav onClick={() => setShowTransaction(true)}>Add new transaction</nav>
                <nav><Link to="/main">Add new saving goal</Link></nav>
                <nav><Link to="/main">add new category</Link></nav>
                <button onClick={() => logout()}>Logout</button>
                <Outlet />
            </div >
            {showTransaction && (
                <NewTransaction onClose={() => setShowTransaction(false)} />
            )
            }
        </>
    );
}

export default Layout;