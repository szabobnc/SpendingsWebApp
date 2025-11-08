import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./Layout";
import TransactionPieChart from "./PieChart";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdEdit } from "react-icons/md";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function Main() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [account, setAccount] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);

    const [extraIncome, setExtraIncome] = useState(0);
    const [negAmount, setNegAmount] = useState(0);

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
        } catch (err) {
            console.error(err);
        }
    };

    // Edit a transaction
    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setShowTransaction(true);
    };

    // Fetch account details to get monthly income
    useEffect(() => {
        if (!user) return;
        const fetchAccount = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch(`${apiUrl}api/account/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAccount(data);
                }
            } catch (err) {
                console.error('Error fetching account:', err);
            } finally {
                setLoadingAccount(false);
            }
        };
        fetchAccount();
    }, [user]);

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

    // Calculate extra income and expenses from transactions
    useEffect(() => {
        setExtraIncome(transactions.filter(e => e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0));
        setNegAmount(transactions.filter(e => !e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0));
    }, [transactions]);

    // Calculate total income and balance
    const monthlyIncome = account?.income || 0;
    const totalIncome = monthlyIncome + extraIncome;
    const balance = totalIncome - negAmount;

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

            <h1>Transaction details</h1>
            <h2>Welcome {user?.name}!</h2>
            
            <h3>Transactions in this month</h3>
            {loadingTransactions || loadingAccount ? (
                <p>Loading...</p>
            ) : (
                <div>
                    {transactions.length > 0 && <TransactionPieChart data={transactions} />}
                    
                    <table className="tx-table">
                        <tbody>
                        <tr>
                            <th colSpan="2">Current month's balance</th>
                        </tr>
                        <tr>
                            <td className="pos-tx">
                                {totalIncome}
                            </td>
                            <td className="neg-tx">
                                -{negAmount}
                            </td>
                        </tr>
                        <tr className={balance > 0 ? "pos-tx" : "neg-tx"}>
                            <td colSpan="2">{balance}</td>
                        </tr>
                        </tbody>
                    </table>
                    
                    {/* Show breakdown of income sources */}
                    <table className="tx-table" style={{marginTop: '10px'}}>
                        <tbody>
                        <tr>
                            <th colSpan="2">Income Breakdown</th>
                        </tr>
                        <tr>
                            <td>Monthly Income</td>
                            <td className="pos-tx">{monthlyIncome}</td>
                        </tr>
                        {extraIncome > 0 && (
                            <tr>
                                <td>Extra Income (This Month)</td>
                                <td className="pos-tx">{extraIncome}</td>
                            </tr>
                        )}
                        <tr style={{fontWeight: 'bold'}}>
                            <td>Total Income</td>
                            <td className="pos-tx">{totalIncome}</td>
                        </tr>
                        <tr style={{fontWeight: 'bold'}}>
                            <td>Total Expenses</td>
                            <td className="neg-tx">{negAmount}</td>
                        </tr>
                        <tr style={{fontWeight: 'bold', fontSize: '1.1em'}}>
                            <td>Balance</td>
                            <td className={balance > 0 ? "pos-tx" : "neg-tx"}>{balance}</td>
                        </tr>
                        </tbody>
                    </table>

                    {transactions.length === 0 ? (
                        <p>No transactions yet.</p>
                    ) : (
                        <table className="tx-table">
                            <tbody>
                            <tr>
                                <th colSpan="5">Transactions</th>
                            </tr>
                            {transactions.map(tx => (
                                <tr key={tx.id}
                                className={tx.is_income ? "pos-tx" : "neg-tx"}>
                                    <td>{new Date(tx.date).toISOString().split("T")[0]}</td>
                                    <td>{tx.is_income ? tx.amount : '-' + tx.amount}</td>
                                    <td>{tx.category_name}</td>
                                    <td>{tx.description}</td>
                                    <td style={{width: '18%'}}>
                                        <button className="edit" onClick={() => handleEdit(tx)}><MdEdit /></button>
                                        <button className="delete" onClick={() => handleDelete(tx.id)}><RiDeleteBin6Line /> </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default Main;