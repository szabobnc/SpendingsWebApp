import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from './context/AuthContext';

function Layout() {
    const { logout } = useAuth();

    return(
        <div className="navbar">
            <nav><Link to="/newTransaction">Add new transaction</Link></nav>
            <nav><Link to="/main">Add new saving goal</Link></nav>
            <nav><Link to="/main">add new category</Link></nav>
            <button onClick={() => logout()}>Logout</button>
            <Outlet />
        </div>
    );
}   

export default Layout;