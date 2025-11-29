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
    const [account, setAccount] = useState(null);
    const [loadingAccount, setLoadingAccount] = useState(true);
    const [savingsGoals, setSavingsGoals] = useState([]);
    const [allSavingsGoalNames, setAllSavingsGoalNames] = useState([]);
    const [loadingSavingsGoals, setLoadingSavingsGoals] = useState(true);

    const [extraIncome, setExtraIncome] = useState(0);
    const [negAmount, setNegAmount] = useState(0);

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
                const current = new Date();
                const res = await fetch(`${apiUrl}api/transactions/?user_id=${user.id}&date=${current.getMonth()}`);
                if (!res.ok) throw new Error("Failed to fetch transactions");
                const data = await res.json();
                console.log('Fetched transactions:', data); // Debug: check if savings_goal is in the response
                setTransactions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingTransactions(false);
            }
        };
        fetchTransactions();
    }, [user]);

    // Fetch savings goals for premium users
    useEffect(() => {
        if (!user || !account) return;
        
        const fetchSavingsGoals = async () => {
            if (!account.is_premium) {
                setLoadingSavingsGoals(false);
                return;
            }

            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${apiUrl}api/savings-goals/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Store all goals (not just active) to check transaction categories
                    setSavingsGoals(data.filter(goal => goal.status === 'active'));
                    // Also store all goal names for transaction checking (including completed/paused)
                    setAllSavingsGoalNames(data.map(goal => goal.name));
                }
            } catch (err) {
                console.error('Error fetching savings goals:', err);
            } finally {
                setLoadingSavingsGoals(false);
            }
        };
        fetchSavingsGoals();
    }, [user, account]);

    // Helper function to check if transaction is from a savings goal
    const isSavingsGoalTransaction = (tx) => {
        if (!tx.category_name) return false;
        // Check against all savings goal names (including completed/paused)
        return allSavingsGoalNames.includes(tx.category_name);
    };

    // Calculate extra income and expenses from transactions
    useEffect(() => {
        setExtraIncome(transactions.filter(e => e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0));
        setNegAmount(transactions.filter(e => !e.is_income).map(e => e.amount).reduce(function (x,y) { return x+y }, 0));
    }, [transactions]);

    // Calculate total income and balance
    const monthlyIncome = account?.income || 0;
    const totalIncome = monthlyIncome + extraIncome;
    const balance = totalIncome - negAmount;

    // Calculate total savings goal contributions
    const totalSavingsContributions = savingsGoals.reduce((sum, goal) => sum + goal.monthly_contribution, 0);

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

            <h1>Transaction details</h1>
            <h2>Welcome {user?.name}!</h2>
            
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

                    {/* Savings Goals Summary for Premium Users */}
                    {account?.is_premium && !loadingSavingsGoals && (
                        <table className="tx-table" style={{marginTop: '10px'}}>
                            <tbody>
                            <tr>
                                <th colSpan="2">
                                    Savings Goals Summary
                                    <button 
                                        onClick={() => navigate('/savings-goals')}
                                        style={{ 
                                            marginLeft: '10px', 
                                            fontSize: '12px', 
                                            padding: '4px 8px',
                                            background: '#10b981'
                                        }}
                                    >
                                        Manage Goals
                                    </button>
                                </th>
                            </tr>
                            {savingsGoals.length > 0 ? (
                                <>
                                    {savingsGoals.map(goal => (
                                        <tr key={goal.id}>
                                            <td>{goal.name}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                            {goal.current_amount.toFixed(0)} / {goal.target_amount.toFixed(0)} Ft
                                                        </div>
                                                        <div style={{ 
                                                            width: '100%', 
                                                            height: '8px', 
                                                            backgroundColor: '#e5e7eb', 
                                                            borderRadius: '4px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${goal.progress_percentage}%`,
                                                                height: '100%',
                                                                backgroundColor: goal.is_on_track ? '#10b981' : '#f59e0b',
                                                                transition: 'width 0.3s ease'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                    <div style={{ 
                                                        fontSize: '12px', 
                                                        color: goal.is_on_track ? '#10b981' : '#f59e0b',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {goal.progress_percentage.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{fontWeight: 'bold', backgroundColor: '#f9fafb'}}>
                                        <td>Total Monthly Contributions</td>
                                        <td className="neg-tx">{totalSavingsContributions}</td>
                                    </tr>
                                    <tr style={{fontWeight: 'bold'}}>
                                        <td>Available after Savings</td>
                                        <td className={balance - totalSavingsContributions > 0 ? "pos-tx" : "neg-tx"}>
                                            {balance - totalSavingsContributions}
                                        </td>
                                    </tr>
                                </>
                            ) : (
                                <tr>
                                    <td colSpan="2" style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                                        No active savings goals. 
                                        <button 
                                            onClick={() => navigate('/savings-goals/new')}
                                            style={{ 
                                                marginLeft: '5px', 
                                                fontSize: '12px', 
                                                padding: '2px 6px',
                                                background: '#10b981'
                                            }}
                                        >
                                            Create one
                                        </button>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}

                    {/* Upgrade to Premium CTA for non-premium users */}
                    {account && !account.is_premium && (
                        <table className="tx-table" style={{marginTop: '10px'}}>
                            <tbody>
                            <tr>
                                <th colSpan="2" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                                    Premium Feature: Savings Goals
                                </th>
                            </tr>
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'center', padding: '15px' }}>
                                    <div style={{ marginBottom: '10px', color: '#6b7280' }}>
                                        Set up to 3 automatic savings goals with smart balance management
                                    </div>
                                    <button 
                                        onClick={() => navigate('/account')}
                                        style={{ 
                                            background: '#f59e0b',
                                            color: 'white',
                                            padding: '8px 16px'
                                        }}
                                    >
                                        Upgrade to Premium
                                    </button>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    )}

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
                                        {!isSavingsGoalTransaction(tx) ? (
                                            <>
                                                <button className="edit" onClick={() => handleEdit(tx)}><MdEdit /></button>
                                                <button className="delete" onClick={() => handleDelete(tx.id)}><RiDeleteBin6Line /> </button>
                                            </>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                    
                    <button style={{ display: "block", margin: "0 auto" }} onClick={ e => navigate("/transactions")}>View all transaction</button>
                    
                </div>
            )}
        </div>
    );
}

export default Main;