import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const apiUrl = process.env.REACT_APP_API_BASE_URL;

function Register() {
    const [username, setUsername] = useState("")
    const [name, setName] = useState("")
    const [birthday, setBirthday] = useState("")
    const [password, setPassword] = useState("")
    const [repassword, setRePassword] = useState("")

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${apiUrl}api/register/`, {
                username,
                name,
                birthday,
                password,
                repassword
            });

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
            <fieldset>
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input type="text" name="username" id="usenrame" placeholder="username" onChange={(e) => setUsername(e.target.value)} />
                    
                    <label htmlFor="name">Full name:</label>
                    <input type="text" name="name" id="name" placeholder="Full name" onChange={(e) => setName(e.target.value)} />
                    
                    <label htmlFor="password">Password:</label>
                    <input type="password" name="password" id="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
                    
                    <label htmlFor="repassword">Password again:</label>
                    <input type="password" name="repassword" id="repassword" placeholder="repassword" onChange={(e) => setRePassword(e.target.value)} />
                    
                    <label htmlFor="birthday">Date of birth:</label>
                    <input type="date" name="birthday" id="birthday" placeholder="1999-12-31" onChange={(e) => setBirthday(e.target.value)} />
                    
                    <button type="submit">Register</button>
                </form>
                <button onClick={() => navigate("/login")}>Back to Login</button>
            </fieldset>
        </div>
    )

}

export default Register;