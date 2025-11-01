import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./context/AuthContext";
import SimpleLayout from "./SimpleLayout";

// Assuming apiUrl is defined in your environment variables, or hardcode your base URL
const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';

function AccountPage() {
    const { user, logout } = useAuth();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

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
        } catch (err) {
            console.error('Error fetching account:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        // Fetch only if user object exists (meaning they logged in)
        if (user) {
            fetchAccount();
        }
    }, [user, fetchAccount]);

    // --- Toggle Premium Status (PATCH Request) ---
    const togglePremium = async () => {
        if (!account) return;
        setUpdating(true);
        setError(null);

        try {
            // Use consistent token key - 'access_token'
            const token = localStorage.getItem('access_token');
            const newPremiumStatus = !account.is_premium;

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

    if (loading) return <SimpleLayout><p>Loading account details...</p></SimpleLayout>;
    if (error) return <SimpleLayout><p className="error-message">Error: {error}</p></SimpleLayout>;
    if (!account) return <SimpleLayout><p>No account data available.</p></SimpleLayout>;

    return (
        <SimpleLayout>
            <div className="account-page">
                <h1>Account Details</h1>

                <div className="account-card">
                    <p><strong>Username:</strong> {account.username}</p>
                    <p><strong>Name:</strong> {account.name}</p>
                    <p><strong>Income:</strong> ${account.income ? account.income.toFixed(2) : '0.00'}</p>
                    <p><strong>Birthday:</strong> {account.birthday || 'Not set'}</p>
                    <p>
                        <strong>Premium:</strong> {account.is_premium ? "Yes" : "No"}
                        <button 
                            onClick={togglePremium} 
                            disabled={updating}
                            style={{marginLeft: '15px', background: account.is_premium ? '#dc2626' : '#10b981'}}
                        >
                            {updating
                                ? "Updating..."
                                : account.is_premium
                                ? "Revoke Premium"
                                : "Upgrade to Premium"}
                        </button>
                    </p>
                </div>
            </div>
        </SimpleLayout>
    );
}

export default AccountPage;