import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./Layout";
import TransactionPieChart from "./PieChart";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function Main() {
    const navigate = useNavigate();

    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    const [posAmount, setPosAmount] = useState(0)
    const [negAmount, setNegAmount] = useState(0)

    const current = new Date();

    // Lifted state
    const [showTransaction, setShowTransaction] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Delete a transaction
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${apiUrl}api/transactions/${id}/`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete transaction");
            setTransactions(transactions.filter(tx => tx.id !== id));
            toast.success('Transaction deleted successfully!', {
                                position: "top-center",
                                autoClose: 5000,
                                hideProgressBar: false,
                                closeOnClick: false,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "colored"
                            });
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
            setPosAmount(transactions.filter(e => e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0))
            setNegAmount(transactions.filter(e => !e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0))
    }, [transactions]);

    return (
        <div>
            <ToastContainer />
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
            
            <h3>Transactions in this month</h3>
            {loadingTransactions ? (
                <p>Loading...</p>
            ) : transactions.length === 0 ? (
                <p>No transactions yet.</p>
            ) : (
                <div>
                    <TransactionPieChart data={transactions} />
                    <table className="tx-table">
                        <tr>
                            <th colSpan="2">Current month's balance</th>
                        </tr>
                        <tr>
                            <td className="pos-tx">
                                {posAmount}
                            </td>
                            <td className="neg-tx">
                                -{negAmount}
                            </td>
                        </tr>
                        <tr className={posAmount-negAmount > 0 ? "pos-tx" : "neg-tx"}>
                            <td colSpan="2">{posAmount-negAmount}</td>
                        </tr>
                    </table>
                    <table className="tx-table">
                        <tr>
                            <th colSpan="5">Transactions</th>
                        </tr>
                        {transactions.map(tx => (
                            <tr className={tx.is_income ? "pos-tx" : "neg-tx"}>
                                <td>{new Date(tx.date).toISOString().split("T")[0]}</td>
                                <td>{tx.is_income ? tx.amount : '-' + tx.amount}</td>
                                <td>{tx.category_name}</td>
                                <td>{tx.description}</td>
                                <td style={{width: '18%'}}>
                                    <button className="edit" onClick={() => handleEdit(tx)}><MdEdit /></button>
                                    <button className="delete" onClick={() => handleDelete(tx.id)}><RiDeleteBin6Line onClick={() => handleDelete(tx.id)} /> </button>
                                </td>
                            </tr>
                        ))}
                    </table>
                    
                    <button style={{ display: "block", margin: "0 auto" }} onClick={ e => navigate("/transactions")}>View all transaction</button>
                    
                </div>
            )}
        </div>
    );
}

export default Main;
