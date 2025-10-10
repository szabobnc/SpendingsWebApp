import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./Layout";

function Main() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    // Lifted state
    const [showTransaction, setShowTransaction] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Delete a transaction
const handleDelete = async (id) => {
    try {
        const res = await fetch(`http://localhost:8000/api/transactions/${id}/`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete transaction");
        setTransactions(transactions.filter(tx => tx.id !== id));
    } catch (err) {
        console.error(err);
    }
};


    // Edit a transaction
const handleEdit = (tx) => {
    setEditingTransaction(tx);
    setShowTransaction(true);
};


    // Fetch transactions
    useEffect(() => {
        if (!user) return;
        const fetchTransactions = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/transactions/?user_id=${user.id}`);
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

            <h1>Main page</h1>
            <h2>Hello {user?.name}!</h2>

            <h3>Transactions</h3>
            {loadingTransactions ? (
                <p>Loading...</p>
            ) : transactions.length === 0 ? (
                <p>No transactions yet.</p>
            ) : (
                <ul>
                    {transactions.map(tx => (
                        <li key={tx.id} className="flex items-center justify-between mb-2">
                            <span>
                                {new Date(tx.date).toISOString().split("T")[0]} - {tx.amount} Ft - {tx.category_name} - ({tx.description}) ({tx.is_income ? "Income" : "Expense"})
                            </span>
                            <span>
                                <button className="mr-2 text-blue-500" onClick={() => handleEdit(tx)}>Edit</button>
                                <button className="text-red-500" onClick={() => handleDelete(tx.id)}>Delete</button>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Main;
