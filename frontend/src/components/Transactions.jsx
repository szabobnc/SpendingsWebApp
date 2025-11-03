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

    const [posAmount, setPosAmount] = useState(0)
    const [negAmount, setNegAmount] = useState(0)

    useEffect(() => {
        setPosAmount(transactions.filter(e => e.is_income).map(e => e.amount).reduce(function (x, y) { return x + y }, 0))
        setNegAmount(transactions.filter(e => !e.is_income).map(e => e.amount).reduce(function (x, y) { return x + y }, 0))
    }, [transactions]);

    const { user } = useAuth();

    const [filters, setFilters] = useState({
        date_from: "",
        date_to: "",
        description: "",
        is_income: "",
        category_id: "",
        user_id: user?.id
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
        setIsLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const fetchTransactions = async () => {
            try {
                const res = await fetch(`${apiUrl}api/history/?${params.toString()}`);
                if (!res.ok) throw new Error("Failed to fetch transactions");
                const data = await res.json();
                setTransactions(data.data);
                console.log('data:', data.data)
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        await fetchTransactions();
    };

    const handleReset = () => {
        const resetFilters = {
            date_from: "",
            date_to: "",
            description: "",
            is_income: "",
            category_id: "",
            user_id: user?.id
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
                    <label>From</label>
                    <input
                        type="date"
                        name="date_from"
                        value={filters.date}
                        onChange={handleChange}
                    />
                    <label>To</label>
                    <input
                        type="date"
                        name="date_to"
                        value={filters.date}
                        onChange={handleChange}
                    />
                    <label>Description</label>
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={filters.description}
                        onChange={handleChange}
                    />
                    <label>Type</label>
                    <select name="is_income" value={filters.is_income} onChange={handleChange}>
                        <option value="">All</option>
                        <option value="1">Income</option>
                        <option value="0">Expense</option>
                    </select>
                    <label>Category</label>
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

            {isLoading ? (<div>Loading...</div>) : transactions.length > 0 && (
                <div>
                    <table className="tx-table">
                        <tr>
                            <th colSpan="2">Balance</th>
                        </tr>
                        <tr>
                            <td className="pos-tx">
                                {posAmount}
                            </td>
                            <td className="neg-tx">
                                -{negAmount}
                            </td>
                        </tr>
                        <tr className={posAmount - negAmount > 0 ? "pos-tx" : "neg-tx"}>
                            <td colSpan="2">{posAmount - negAmount}</td>
                        </tr>
                    </table>
                    <table className="tx-table">
                        <tr>
                            <th colSpan="4">Transactions</th>
                        </tr>
                        {transactions?.map(tx => (
                            <tr className={tx.is_income ? "pos-tx" : "neg-tx"}>
                                <td>{new Date(tx.date).toISOString().split("T")[0]}</td>
                                <td>{tx.is_income ? tx.amount : '-' + tx.amount}</td>
                                <td>{tx.category_name}</td>
                                <td>{tx.description}</td>

                            </tr>
                        ))}
                    </table>
                </div>
            )}

        </div>
    )
}


export default Transactions;