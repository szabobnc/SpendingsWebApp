import { createContext, useContext, useState, useEffect } from 'react';
import { ToastContainer, toast } from "react-toastify";
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_BASE_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const Msg = ({ data }) => {
    return (
      <div className="msg-container">
        <p className="msg-title">{data.title}</p>
        <p className="msg-description">{data.text}</p>
      </div>
    );
  };


  const login = async (credentials) => {
    try {
      const response = await axios.post(`${apiUrl}api/login/`, credentials);
      const { access, refresh, user } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      return user;

    } catch (error) {
      console.error("Login failed:", error.response.data.error);
      if (error.response.data.error) {
        toast.error(error.response.data.error, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        console.error("Network error or no response received.");
        toast.error("Network error or no response received.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    }

  };

  const logout = async () => {
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ login, logout, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};