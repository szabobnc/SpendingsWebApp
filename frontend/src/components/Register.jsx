import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";


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

    const resetForm = () => {
        setUsername("");
        setName("");
        setBirthday("");
        setPassword("");
        setRePassword("");
    };

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

            console.log(
                password,
                repassword)
            console.log(response.data);

            if(response.data.success){
                resetForm();
                toast.success('Profile created successfully!', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored"
                });
            } else {
                toast.error(response.data.message, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored"
                });

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
        <>
        <ToastContainer />
            <div className="login">
                <fieldset>
                    <h1>Register</h1>
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

                        <label htmlFor="birthday">Date of birth:</label>
                        <input
                            type="date"
                            name="birthday"
                            id="birthday"
                            placeholder="1999-12-31"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            style={{ marginTop: "20px", background: "#205b9f", color: "white" }}
                        >
                            Register
                        </button>
                    </form>
                    <button type="button" onClick={resetForm}>Reset</button>
                    <button onClick={() => navigate("/login")}>Back to Login</button>
                </fieldset>
            </div>
        </>
    )
}

export default Register;