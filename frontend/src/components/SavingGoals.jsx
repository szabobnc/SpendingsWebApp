import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import SimpleLayout from "./SimpleLayout";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdEdit, MdAdd } from "react-icons/md";

const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';

function SavingGoals() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingContributions, setProcessingContributions] = useState(false);
    const [showForceDialog, setShowForceDialog] = useState(false);
    const [forceDialogData, setForceDialogData] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [checkingPremium, setCheckingPremium] = useState(true);

    // Check premium status from account endpoint
    useEffect(() => {
        const checkPremiumStatus = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(`${apiUrl}api/account/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsPremium(data.is_premium);
                    
                    // Update user in localStorage
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    storedUser.is_premium = data.is_premium;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                } else if (response.status === 401) {
                    logout();
                }
            } catch (err) {
                console.error('Error checking premium status:', err);
            } finally {
                setCheckingPremium(false);
            }
        };

        if (user) {
            checkPremiumStatus();
        }
    }, [user, logout]);

    // Fetch savings goals
    const fetchGoals = async () => {
        if (!isPremium) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                logout();
                return;
            }

            const response = await fetch(`${apiUrl}api/savings-goals/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
                if (response.status === 403) {
                    throw new Error('Savings goals are only available for premium users.');
                }
                throw new Error(`Failed to fetch savings goals: ${response.statusText}`);
            }

            const data = await response.json();
            setGoals(data);
        } catch (err) {
            console.error('Error fetching savings goals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && !checkingPremium) {
            fetchGoals();
        }
    }, [user, isPremium, checkingPremium]);

    // Delete goal
    const handleDelete = async (goalId) => {
        if (!window.confirm('Are you sure you want to delete this savings goal?')) {
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${apiUrl}api/savings-goals/${goalId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete savings goal');
            }

            setGoals(goals.filter(goal => goal.id !== goalId));
            toast.success('Savings goal deleted successfully!', {
                position: "top-center",
                autoClose: 3000,
                theme: "colored"
            });
        } catch (err) {
            console.error('Error deleting goal:', err);
            toast.error('Failed to delete savings goal', {
                position: "top-center",
                autoClose: 3000,
                theme: "colored"
            });
        }
    };

    // Process monthly contributions
    const processContributions = async (force = false) => {
        setProcessingContributions(true);
        try {
            const token = localStorage.getItem('access_token');
            const endpoint = force ? 'force-contributions' : 'process-contributions';
            
            const response = await fetch(`${apiUrl}api/savings-goals/${endpoint}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.requires_permission) {
                    setForceDialogData(data);
                    setShowForceDialog(true);
                    return;
                }
                throw new Error(data.message || 'Failed to process contributions');
            }

            toast.success(data.message, {
                position: "top-center",
                autoClose: 5000,
                theme: "colored"
            });

            // Refresh goals to show updated amounts
            fetchGoals();
        } catch (err) {
            console.error('Error processing contributions:', err);
            toast.error(err.message, {
                position: "top-center",
                autoClose: 5000,
                theme: "colored"
            });
        } finally {
            setProcessingContributions(false);
            setShowForceDialog(false);
            setForceDialogData(null);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return `${amount.toFixed(2)} Ft`;
    };

    // Get status color
    const getStatusColor = (goal) => {
        if (goal.status === 'completed') return '#10b981';
        if (!goal.is_on_track) return '#ef4444';
        return '#f59e0b';
    };

    // Get status text
    const getStatusText = (goal) => {
        if (goal.status === 'completed') return 'Completed';
        if (!goal.is_on_track) return 'Behind Schedule';
        return 'On Track';
    };

    // Show upgrade prompt for non-premium users
    if (checkingPremium) {
        return <SimpleLayout><p>Loading...</p></SimpleLayout>;
    }

    if (!isPremium) {
        return (
            <>
                <ToastContainer />
                <SimpleLayout>
                    <div className="savings-goals-page">
                        <h1>Savings Goals - Premium Feature</h1>
                        <div style={{
                            background: '#fef3c7',
                            border: '2px solid #f59e0b',
                            padding: '30px',
                            borderRadius: '10px',
                            textAlign: 'center',
                            marginTop: '40px'
                        }}>
                            <h2 style={{ color: '#92400e', marginBottom: '20px' }}>
                                Upgrade to Premium to Access Savings Goals
                            </h2>
                            <p style={{ fontSize: '16px', marginBottom: '20px', color: '#78350f' }}>
                                Set up to 3 automatic savings goals with smart balance management:
                            </p>
                            <ul style={{ 
                                textAlign: 'left', 
                                maxWidth: '500px', 
                                margin: '0 auto 30px',
                                fontSize: '14px',
                                color: '#78350f'
                            }}>
                                <li>💰 Automatic first contribution when creating a goal</li>
                                <li>🛡️ Smart balance protection (1/3 balance check)</li>
                                <li>📊 Track progress with visual indicators</li>
                                <li>🎯 Set deadlines and monitor on-track status</li>
                                <li>✅ Auto-completion when goals are reached</li>
                            </ul>
                            <button
                                onClick={() => navigate('/account')}
                                style={{
                                    background: '#f59e0b',
                                    color: 'white',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Upgrade to Premium Now
                            </button>
                        </div>
                    </div>
                </SimpleLayout>
            </>
        );
    }

    if (loading) return <SimpleLayout><p>Loading savings goals...</p></SimpleLayout>;
    if (error) return <SimpleLayout><p className="error-message">Error: {error}</p></SimpleLayout>;

    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');

    return (
        <>
            <ToastContainer />
            <SimpleLayout>
                <div className="savings-goals-page">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1>Savings Goals</h1>
                        <div>
                            <button 
                                onClick={() => navigate('/savings-goals/new')}
                                style={{ 
                                    marginRight: '10px', 
                                    background: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                                disabled={activeGoals.length >= 3}
                            >
                                <MdAdd /> New Goal
                            </button>
                            
                        </div>
                    </div>

                    {activeGoals.length >= 3 && (
                        <div style={{ 
                            background: '#fef3c7', 
                            border: '1px solid #f59e0b', 
                            padding: '10px', 
                            borderRadius: '5px',
                            marginBottom: '20px',
                            color: '#92400e'
                        }}>
                            You have reached the maximum of 3 active savings goals. Complete or delete a goal to create a new one.
                        </div>
                    )}

                    <div style={{
                        background: '#e0f2fe',
                        border: '1px solid #0ea5e9',
                        padding: '15px',
                        borderRadius: '5px',
                        marginBottom: '20px',
                        color: '#075985'
                    }}>
                        <strong>ℹ️ Note:</strong> When you create a new savings goal, the first month's contribution will be automatically deducted from your balance. The "Process Monthly Contributions" button is for subsequent monthly contributions.
                    </div>

                    {/* Active Goals */}
                    {activeGoals.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <h2>Active Goals ({activeGoals.length}/3)</h2>
                            <div className="goals-grid">
                                {activeGoals.map(goal => (
                                    <div key={goal.id} className="goal-card" style={{ border: `2px solid ${getStatusColor(goal)}` }}>
                                        <div className="goal-header">
                                            <h3>{goal.name}</h3>
                                            <div className="goal-actions">
                                                <button 
                                                    className="edit" 
                                                    onClick={() => navigate(`/savings-goals/edit/${goal.id}`)}
                                                >
                                                    <MdEdit />
                                                </button>
                                                <button 
                                                    className="delete" 
                                                    onClick={() => handleDelete(goal.id)}
                                                >
                                                    <RiDeleteBin6Line />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="goal-progress">
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ 
                                                        width: `${goal.progress_percentage}%`,
                                                        backgroundColor: getStatusColor(goal)
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">
                                                {goal.progress_percentage.toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="goal-details">
                                            <div className="goal-amounts">
                                                <div>
                                                    <strong>Saved:</strong> {formatCurrency(goal.current_amount)}
                                                </div>
                                                <div>
                                                    <strong>Target:</strong> {formatCurrency(goal.target_amount)}
                                                </div>
                                                <div>
                                                    <strong>Monthly:</strong> {formatCurrency(goal.monthly_contribution)}
                                                </div>
                                            </div>
                                            
                                            <div className="goal-timeline">
                                                {goal.deadline && (
                                                    <div>
                                                        <strong>Deadline:</strong> {new Date(goal.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                                {goal.months_remaining !== null && (
                                                    <div>
                                                        <strong>Months remaining:</strong> {goal.months_remaining}
                                                    </div>
                                                )}
                                                <div style={{ color: getStatusColor(goal), fontWeight: 'bold' }}>
                                                    <strong>Status:</strong> {getStatusText(goal)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Goals */}
                    {completedGoals.length > 0 && (
                        <div>
                            <h2>Completed Goals</h2>
                            <div className="goals-grid">
                                {completedGoals.map(goal => (
                                    <div key={goal.id} className="goal-card completed">
                                        <div className="goal-header">
                                            <h3>{goal.name}</h3>
                                            <div className="goal-actions">
                                                <button 
                                                    className="delete" 
                                                    onClick={() => handleDelete(goal.id)}
                                                >
                                                    <RiDeleteBin6Line />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="goal-progress">
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill" 
                                                    style={{ 
                                                        width: '100%',
                                                        backgroundColor: '#10b981'
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">100%</span>
                                        </div>

                                        <div className="goal-details">
                                            <div className="goal-amounts">
                                                <div>
                                                    <strong>Final Amount:</strong> {formatCurrency(goal.current_amount)}
                                                </div>
                                                <div>
                                                    <strong>Target:</strong> {formatCurrency(goal.target_amount)}
                                                </div>
                                            </div>
                                            
                                            <div className="goal-timeline">
                                                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                                    ✅ Completed
                                                </div>
                                                <div>
                                                    <strong>Completed:</strong> {new Date(goal.updated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {goals.length === 0 && (
                        <div className="empty-state">
                            <h3>No savings goals yet</h3>
                            <p>Create your first savings goal to start building towards your financial objectives!</p>
                            <button 
                                onClick={() => navigate('/savings-goals/new')}
                                style={{ background: '#10b981', marginTop: '15px' }}
                            >
                                Create Your First Goal
                            </button>
                        </div>
                    )}

                    {/* Force Contribution Dialog */}
                    {showForceDialog && forceDialogData && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>Insufficient Balance</h3>
                                <p>{forceDialogData.message}</p>
                                <div style={{ margin: '15px 0' }}>
                                    <div><strong>Current Balance:</strong> {formatCurrency(forceDialogData.current_balance)}</div>
                                    <div><strong>Required Balance:</strong> {formatCurrency(forceDialogData.required_balance)}</div>
                                </div>
                                <p>Do you want to proceed anyway? This may result in a negative balance.</p>
                                <div className="modal-actions">
                                    <button 
                                        onClick={() => processContributions(true)}
                                        style={{ background: '#ef4444', marginRight: '10px' }}
                                        disabled={processingContributions}
                                    >
                                        {processingContributions ? 'Processing...' : 'Proceed Anyway'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowForceDialog(false);
                                            setForceDialogData(null);
                                            setProcessingContributions(false);
                                        }}
                                        style={{ background: '#6b7280' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SimpleLayout>
        </>
    );
}

export default SavingGoals;