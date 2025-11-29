import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import SimpleLayout from "./SimpleLayout";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

// Assuming apiUrl is defined in your environment variables, or hardcode your base URL
const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';

function AccountPage() {
    const { user, logout } = useAuth();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [editingIncome, setEditingIncome] = useState(false);
    const [newIncome, setNewIncome] = useState('');

    const navigate = useNavigate()
    const location = useLocation();
    const handleRef = useRef(false);


    // --- Fetch Account Details on Load ---
    const fetchAccount = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Use consistent token key - 'access_token'
            const token = localStorage.getItem('access_token');

            if (!token) {
                console.warn("No token found. Executing logout.");
                logout();
                return;
            }

            // --- Now use the correct token in the fetch headers ---
            const response = await fetch(`${apiUrl}api/account/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // This is the safety check for expired token
                if (response.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(`Failed to fetch account: ${response.statusText}`);
            }

            const data = await response.json();
            setAccount(data);
            setNewIncome(data.income || 0);
        } catch (err) {
            console.error('Error fetching account:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [logout]);

    // Fetch transactions to calculate balance
    useEffect(() => {
        if (!user) return;
        const fetchTransactions = async () => {
            try {
                const current = new Date();
                const res = await fetch(`${apiUrl}api/transactions/?user_id=${user.id}&date=${current.getMonth()}`);
                if (!res.ok) throw new Error("Failed to fetch transactions");
                const data = await res.json();
                setTransactions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingTransactions(false);
            }
        };
        fetchTransactions();
    }, [user]);

    useEffect(() => {
        // Fetch only if user object exists (meaning they logged in)
        if (user) {
            fetchAccount();
        }
    }, [user, fetchAccount]);

    // --- Update Monthly Income ---
    const updateIncome = async () => {
        if (!account) return;
        setUpdating(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${apiUrl}api/account/`, {
                method: "PATCH",
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ income: parseInt(newIncome) }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error("Failed to update income");
            }

            const data = await res.json();
            setAccount(data);
            setEditingIncome(false);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    // --- Toggle Premium Status (PATCH Request) ---
    const togglePremium = async () => {
        if (!account) return;
        setUpdating(true);
        setError(null);

        try {
            // Use consistent token key - 'access_token'
            const token = localStorage.getItem('access_token');
            const newPremiumStatus = !account.is_premium;

            if (newPremiumStatus) {
                navigate("/payment");
                setUpdating(false);
                return;
            }

            const res = await fetch(`${apiUrl}api/account/`, {
                method: "PATCH",
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ is_premium: newPremiumStatus }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error("Failed to update premium status");
            }

            const data = await res.json();
            setAccount(data); // Update local state with the new data
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const activatePremium = async () => {
        setUpdating(true);
        setError(null);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${apiUrl}api/account/`, {
                method: "PATCH",
                headers: {
                    'Content-Type': "application/json",
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ is_premium: true }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error("Failed to update premium status");
            }

            const data = await res.json();
            setAccount(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUpdating(false)
        }
        console.log("succes")
        toast.success("The payment was successful! Your account is now premium!", {
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

    useEffect(() => {
        if (location.state?.paymentSuccess && !handleRef.current) {
            activatePremium();
            handleRef.current = true;
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);

    // Calculate balance components
    const monthlyIncome = account?.income || 0;
    const extraIncome = transactions
        .filter(tx => tx.is_income)
        .reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions
        .filter(tx => !tx.is_income)
        .reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = monthlyIncome + extraIncome;
    const balance = totalIncome - expenses;

    if (loading) return <SimpleLayout><p>Loading account details...</p></SimpleLayout>;
    if (error) return <SimpleLayout><p className="error-message">Error: {error}</p></SimpleLayout>;
    if (!account) return <SimpleLayout><p>No account data available.</p></SimpleLayout>;

    return (
        <>
            <ToastContainer />
            <SimpleLayout>
                <div className="account-page">
                    <h1>Account Details</h1>

                    <div className="account-card">
                        <table className="acc-table">
                            <tbody>
                                <tr>
                                    <th>Username</th>
                                    <td>{account.username}</td>
                                </tr>
                                <tr>
                                    <th>Name</th>
                                    <td>{account.name}</td>
                                </tr>

                                <tr>
                                    <th>Monthly Income</th>
                                    <td>
                                        {editingIncome ? (
                                            <div className="button-row">
                                                <input
                                                    type="number"
                                                    value={newIncome}
                                                    onChange={(e) => setNewIncome(e.target.value)}
                                                />
                                                <button onClick={updateIncome} disabled={updating}>
                                                    {updating ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingIncome(false);
                                                        setNewIncome(account.income || 0);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="button-row">
                                                <span className="pos-tx">{monthlyIncome.toFixed(2)} Ft</span>
                                                <button onClick={() => setEditingIncome(true)}>
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {extraIncome > 0 && (
                                    <tr>
                                        <th>Extra Income (This Month)</th>
                                        <td>
                                            <span className="pos-tx">{extraIncome.toFixed(2)} Ft</span>
                                        </td>
                                    </tr>
                                )}

                                <tr>
                                    <th>Total Income</th>
                                    <td><span className="pos-tx">{totalIncome.toFixed(2)} Ft</span></td>
                                </tr>

                                <tr>
                                    <th>Total Expenses</th>
                                    <td><span className="neg-tx">{expenses.toFixed(2)} Ft</span></td>
                                </tr>

                                <tr>
                                    <th>Balance</th>
                                    <td>
                                        <span className={balance >= 0 ? "pos-tx" : "neg-tx"}>
                                            {loadingTransactions ? "Calculating..." : balance.toFixed(2)} Ft
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <th>Birthday</th>
                                    <td>{account.birthday || "Not set"}</td>
                                </tr>

                                <tr>
                                    <th>Premium</th>
                                    <td>
                                        <div className="button-row">
                                            <span>{account.is_premium ? "Yes" : "No"}</span>
                                            <button onClick={togglePremium} disabled={updating}>
                                                {updating
                                                    ? "Updating..."
                                                    : account.is_premium
                                                        ? "Revoke Premium"
                                                        : "Upgrade to Premium"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </SimpleLayout>
        </>
    );
}

export default AccountPage;