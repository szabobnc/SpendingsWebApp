import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import axios from "axios";
import Layout from "./Layout";

const apiUrl = process.env.REACT_APP_API_BASE_URL;


function Transactions() {
    const [showTransaction, setShowTransaction] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuth();


    const [filters, setFilters] = useState({
        amount: "",
        date: "",
        description: "",
        is_income: "",
        category_id: "",
    });

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fetchTransactions = async () => {
            try {
                const res = await fetch(`${apiUrl}api/transactions/?user_id=${user.id}}`);
                if (!res.ok) throw new Error("Failed to fetch transactions");
                const data = await res.json();
                setTransactions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    };

    const handleReset = () => {
        const resetFilters = {
            amount: "",
            date: "",
            description: "",
            is_income: "",
            category_id: "",
        };
        setFilters(resetFilters);
    };

    return (
        <div>
            <Layout
                onAddTransaction={(tx) => {
                    // Update list after add/edit
                    setTransactions((prev) => {
                        // If already exists, replace
                        const index = prev.findIndex(t => t.id === tx.id);
                        if (index >= 0) {
                            const newList = [...prev];
                            newList[index] = tx;
                            return newList;
                        }
                        return [tx, ...prev];
                    });
                    setEditingTransaction(null);
                    setShowTransaction(false);
                }}
                showTransaction={showTransaction}
                setShowTransaction={setShowTransaction}
                editingTransaction={editingTransaction}
                setEditingTransaction={setEditingTransaction}
            />

            <div className="search-bar">
                <form onSubmit={handleSubmit}>
                    <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        value={filters.amount}
                        onChange={handleChange}
                    />
                    <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={filters.description}
                        onChange={handleChange}
                    />
                    <select name="is_income" value={filters.is_income} onChange={handleChange}>
                        <option value="">All</option>
                        <option value="1">Income</option>
                        <option value="0">Expense</option>
                    </select>
                    <select name="category_id" value={filters.category_id} onChange={handleChange}>
                        <option value="">All categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="search-btn">Search</button>
                    <button type="button" className="reset-btn" onClick={handleReset}>Reset</button>
                </form>
            </div>


        </div>
    )
}


export default Transactions;