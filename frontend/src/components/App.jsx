import Login from "./Login";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from "./Register";
import Main from "./Main";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import NewTransaction from "./NewTransaction";
import NewCategory from "./NewCategory";
import AccountPage from './AccountPage';
import { ThemeProvider } from './ThemeProvider';

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
              <Route path="/main" element={<Main />} />
              <Route path="/account" element={<AccountPage />}/>
            </Route>
            
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  )

}

export default App;