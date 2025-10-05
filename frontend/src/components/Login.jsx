import { useEffect, useState } from "react";
import axios from "axios";


const apiUrl = process.env.REACT_APP_API_BASE_URL;

function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${apiUrl}login/`, {
                username,
                password
            });
            const token = response.data;
            sessionStorage.setItem('access', token.access)
            sessionStorage.setItem('refresh', token.refresh)
            console.log(response.data);

        } catch (error) {
            if (error.response) {
                const msg = error.response.data?.message || 'Unknown server error!';
                alert(`Error: ${msg}`);
            } else if (error.request) {
                alert('Server not responding!');
            } else {
                alert('Request error: ' + error.message);
            }
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Username:</label>
                <input type="text" name="username" id="usenrame" placeholder="username" onChange={(e) => setUsername(e.target.value)} />
                <label htmlFor="password">Password:</label>
                <input type="password" name="password" id="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button>
            </form>
        </div>
    )

}

export default Login;