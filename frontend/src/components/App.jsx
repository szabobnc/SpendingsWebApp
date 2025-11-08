import Login from "./Login";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from "./Register";
import Main from "./Main";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory";
import Transactions from "./Transactions";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/newTransaction" element={<NewTransaction />} />
            <Route path="/NewCategory" element={<NewCategory />} />
            <Route path="/main" element={<Main />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>

        </Routes>
      </AuthProvider>
      <ToastContainer />
    </Router>
  )

}

export default App;
