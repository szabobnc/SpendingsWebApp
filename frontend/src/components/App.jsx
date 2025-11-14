import Login from "./Login";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from "./Register";
import Main from "./Main";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory";
import AccountPage from './AccountPage';
import Transactions from "./Transactions";
import SavingGoals from "./SavingGoals";
import NewSavingGoal from "./NewSavingGoal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from './ThemeProvider';
import PaymentPage from "./PaymentPage";

const App = () => {

  return (
    <ThemeProvider defaultTheme="light" storageKey="expense-tracker-theme">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/newTransaction" element={<NewTransaction />} />
            <Route path="/NewCategory" element={<NewCategory />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/newTransaction" element={<NewTransaction />} />
              <Route path="/NewCategory" element={<NewCategory />} />
              <Route path="/main" element={<Main />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/savings-goals" element={<SavingGoals />} />
              <Route path="/savings-goals/new" element={<NewSavingGoal />} />
              <Route path="/savings-goals/edit/:id" element={<NewSavingGoal />} />
            </Route>

          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )

}

export default App;