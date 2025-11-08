import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function Login() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(credentials);
            if (user) {
                navigate('/main');
            }

        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (

        <>
            <div className="login">
                <fieldset>
                    <h1>Login</h1>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="username">Username:</label>
                        <input type="text" name="username" id="usenrame" placeholder="username" onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} />
                        <label htmlFor="password">Password:</label>
                        <input type="password" name="password" id="password" placeholder="password" onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} />
                        <button type="submit" style={{ marginTop: '20px', background: '#205b9f', color: 'white' }}>Login</button>
                    </form>
                    <p>Don’t have an account? Sign up now!</p>
                    <button onClick={() => navigate("/register")}>Register</button>
                </fieldset>
            </div>
            <ToastContainer />
        </>
    )

}

export default Login;