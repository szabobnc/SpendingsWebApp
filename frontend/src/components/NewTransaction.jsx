import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function NewTransaction({ onClose, onAdd, editingTransaction, setEditingTransaction }) {
    const { user, loading } = useAuth();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [limitWarning, setLimitWarning] = useState(null);

    const [details, setDetails] = useState({
        user: '',
        is_income: '',
        category: '',
        amount: '',
        date: '',
        description: '',
    });

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${apiUrl}api/getCategories/?user_id=${user.id}`);
                setCategories(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Prefill form if editing
    useEffect(() => {
        if (editingTransaction) {
            setDetails({
                user: editingTransaction.user,
                is_income: editingTransaction.is_income.toString(),
                category: editingTransaction.category || '',
                amount: editingTransaction.amount,
                date: editingTransaction.date.split('T')[0],
                description: editingTransaction.description,
            });
        } else if (user) {
            setDetails({
                user: user.id,
                is_income: '',
                category: '',
                amount: '',
                date: '',
                description: '',
            });
        }
    }, [editingTransaction, user]);

    // Check spending limit when category or amount changes
    useEffect(() => {
        const checkLimit = async () => {
            if (details.category && details.amount && details.is_income === 'false') {
                try {
                    const token = localStorage.getItem("access_token");
                    const res = await axios.get(
                        `${apiUrl}api/category-spending/${details.category}/`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    if (res.data.has_limit) {
                        const newTotal = res.data.total_spent + parseInt(details.amount);
                        const newPercentage = (newTotal / res.data.limit_amount) * 100;

                        if (newTotal > res.data.limit_amount) {
                            setLimitWarning({
                                type: 'exceeded',
                                message: `⚠️ WARNING: This transaction will exceed your ${res.data.category_name} limit by ${newTotal - res.data.limit_amount} Ft!`,
                                data: res.data
                            });
                        } else if (newPercentage >= 80) {
                            setLimitWarning({
                                type: 'warning',
                                message: `⚠️ CAUTION: This transaction will bring you to ${newPercentage.toFixed(1)}% of your ${res.data.category_name} limit.`,
                                data: res.data
                            });
                        } else {
                            setLimitWarning(null);
                        }
                    } else {
                        setLimitWarning(null);
                    }
                } catch (err) {
                    // User might not be premium or no limit set
                    setLimitWarning(null);
                }
            } else {
                setLimitWarning(null);
            }
        };

        const debounceTimer = setTimeout(checkLimit, 500);
        return () => clearTimeout(debounceTimer);
    }, [details.category, details.amount, details.is_income]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Show confirmation if limit is exceeded
        if (limitWarning?.type === 'exceeded') {
            const confirmed = window.confirm(
                `${limitWarning.message}\n\nDo you want to proceed anyway?`
            );
            if (!confirmed) {
                return;
            }
        }

        try {
            let res;
            if (editingTransaction) {
                res = await axios.patch(`${apiUrl}api/transactions/${editingTransaction.id}/`, details);
                toast.success('Transaction modified successfully!', {
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
                res = await axios.post(`${apiUrl}api/createTransaction/`, details);
                toast.success('Transaction created successfully!', {
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

            // Show limit warning if present in response
            if (res.data.limit_check) {
                const check = res.data.limit_check;
                if (check.exceeded) {
                    toast.warn(`You have exceeded your limit for this category!\nLimit: ${check.limit_amount}\nTotal Spent: ${check.total_spent} Ft\nOver by: ${check.total_spent - check.limit_amount} Ft`, {
                        position: "top-center",
                        autoClose: 10000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored"
                    });
                } else if (check.warning) {
                    toast.warn(`Warning: You have used ${check.percentage}% of your limit for this category.\nLimit: ${check.limit_amount} Ft\nRemaining: ${check.remaining} Ft`, {
                        position: "top-center",
                        autoClose: 10000,
                        hideProgressBar: false,
                        closeOnClick: false,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "colored"
                    });
                }
            }

            onAdd(res.data);

            // Clear edit state
            if (editingTransaction) setEditingTransaction(null);

            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save transaction. Please try again.");
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <div className="overlay">
                <div className="modal">
                    <fieldset>
                        <form onSubmit={handleSubmit}>
                            <h1>{editingTransaction ? "Edit Transaction" : "Create Transaction"}</h1>

                            <label>
                                <input type="radio" name="is_income" value="true" checked={details.is_income === 'true'} onChange={e => setDetails({ ...details, is_income: e.target.value })} required />
                                Income
                            </label>

                            <label>
                                <input type="radio" name="is_income" value="false" checked={details.is_income === 'false'} onChange={e => setDetails({ ...details, is_income: e.target.value })} required />
                                Expense
                            </label>

                            <label>Category</label>
                            <select value={details.category} onChange={e => setDetails({ ...details, category: e.target.value })} required>
                                <option value="">Choose a category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <label>Amount</label>
                            <input type="number" value={details.amount} onChange={e => setDetails({ ...details, amount: e.target.value })} required />

                            {limitWarning && (
                                <div style={{
                                    padding: '10px',
                                    marginTop: '10px',
                                    margin: 'auto',
                                    width: '250px',
                                    marginBottom: '10px',
                                    backgroundColor: limitWarning.type === 'exceeded' ? '#ffebee' : '#fff3e0',
                                    border: `2px solid ${limitWarning.type === 'exceeded' ? '#f44336' : '#ff9800'}`,
                                    borderRadius: '4px',
                                    color: limitWarning.type === 'exceeded' ? '#c62828' : '#e65100'
                                }}>
                                    {limitWarning.message}
                                </div>
                            )}

                            <label>Description</label>
                            <input type="text" value={details.description} onChange={e => setDetails({ ...details, description: e.target.value })} required />

                            <div className="button-group">
                            <button type="submit">{editingTransaction ? "Save Changes" : "Create"}</button>
                            <button className="delete" type="button" onClick={onClose}>Close</button>
                            </div>
                        </form>
                    </fieldset>
                </div>
            </div>
        </>
    );
}

export default NewTransaction;