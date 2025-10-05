import { Navigate } from "react-router-dom";
import { useAuth } from './AuthContext';


const PrivateRoute = ({ children, roles = [] }) => {

  const {isAuthenticated, user, isLoading} = useAuth();

  if(isLoading){
    return (
      <div>Loading...</div>
    )
  }

  if(!isAuthenticated){
    return <Navigate to="/login" replace/>;
  }

  if (!roles.includes(JSON.parse(user).role)) {
      return <Navigate to="/unauthorized"/>;
  }

  return children;
  
};


export const Unauthorized = () => {
  return (
    <>
      <div className="unauthorized">
        <h1>403</h1>
      </div>
    </>
  );
}

export default PrivateRoute;
