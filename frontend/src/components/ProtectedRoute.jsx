import { Navigate, Outlet , useNavigate} from 'react-router-dom';
import { useAuth } from './context/AuthContext';


const ProtectedRoute = ()=>{
    const navigate = useNavigate();
    const { user, loading } = useAuth();

      if (loading) {
    return <div>Loading...</div>; 
  }

    return user ? <Outlet /> : <Navigate to="/" replace />;
}


export default ProtectedRoute;