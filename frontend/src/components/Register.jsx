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
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState("")

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            const response = await axios.post(`${apiUrl}api/register/`, {
                username,
                name,
                birthday: birthday || null, // Send null if empty
                password,
                repassword
            });

            console.log("Registration response:", response.data);
            
            if (response.data.success) {
                setMessage("Registration successful! You can now login.");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                setMessage(response.data.message || "Registration failed");
            }

        } catch (error) {
            console.error("Registration error:", error);
            if (error.response) {
                const msg = error.response.data?.message || 'Unknown server error!';
                setMessage(`Error: ${msg}`);
            } else if (error.request) {
                setMessage('Server not responding!');
            } else {
                setMessage('Request error: ' + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login">
            <fieldset>
                <h1>Register</h1>
                {message && (
                    <div className={message.includes("successful") ? "success-message" : "error-message"}>
                        {message}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input 
                        type="text" 
                        name="username" 
                        id="username" 
                        placeholder="username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                        required
                    />
                    
                    <label htmlFor="name">Full name:</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        placeholder="full name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)} 
                        required
                    />
                    
                    <label htmlFor="password">Password:</label>
                    <input 
                        type="password" 
                        name="password" 
                        id="password" 
                        placeholder="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                        required
                    />
                    
                    <label htmlFor="repassword">Password again:</label>
                    <input 
                        type="password" 
                        name="repassword" 
                        id="repassword" 
                        placeholder="password" 
                        value={repassword}
                        onChange={(e) => setRePassword(e.target.value)} 
                        required
                    />
                    
                    <label htmlFor="birthday">Date of birth (optional):</label>
                    <input 
                        type="date" 
                        name="birthday" 
                        id="birthday" 
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)} 
                    />
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{
                            marginTop: '20px', 
                            background: isLoading ? '#ccc' : '#205b9f', 
                            color: 'white'
                        }}
                    >
                        {isLoading ? "Registering..." : "Register"}
                    </button>
                </form>
                <button onClick={() => navigate("/login")}>Back to Login</button>
            </fieldset>
        </div>
    )
}

export default Register;