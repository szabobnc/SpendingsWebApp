import Login from "./Login";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from "./Register";
import Main from "./Main";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory";

const App = () => {

  return (
<Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/newTransaction" element={<NewTransaction />} />
          <Route path="/NewCategory" element={<NewCategory />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<Main />} />
          </Route>
          
        </Routes>
      </AuthProvider>
</Router>
  )

}

export default App;
