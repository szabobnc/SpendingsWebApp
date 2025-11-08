import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "./context/AuthContext";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function NewTransaction({ onClose, onAdd, editingTransaction, setEditingTransaction }) {
    const { user, loading } = useAuth();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                const res = await axios.get(`${apiUrl}api/getCategories/`);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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

            onAdd(res.data);

            // Clear edit state
            if (editingTransaction) setEditingTransaction(null);

            onClose();
        } catch (err) {
            console.error(err);
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

                        <label>Description</label>
                        <input type="text" value={details.description} onChange={e => setDetails({ ...details, description: e.target.value })} required />

                        <button type="submit">{editingTransaction ? "Save Changes" : "Create"}</button>
                        <button type="button" onClick={onClose}>Close</button>
                    </form>
                </fieldset>
            </div>
        </div>
        </>
    );
}

export default NewTransaction;
