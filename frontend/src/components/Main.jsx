import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./Layout";

function Main() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;
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
            <Layout onAddTransaction={(tx) => setTransactions([tx, ...transactions])} />
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
                        <li key={tx.id}>
                          {new Date(tx.date).toISOString().split("T")[0]} - {tx.amount} Ft - {tx.category_name} - ( {tx.description} )({tx.is_income ? "Income" : "Expense"})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Main;
