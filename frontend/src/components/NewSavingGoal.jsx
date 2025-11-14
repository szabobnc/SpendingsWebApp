import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import SimpleLayout from "./SimpleLayout";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/';

function NewSavingGoal() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        monthly_contribution: '',
        deadline: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchingGoal, setFetchingGoal] = useState(isEditing);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);

    // Fetch existing goal data if editing
    useEffect(() => {
        if (isEditing && user) {
            fetchGoalData();
        }
    }, [isEditing, user, id]);

    const fetchGoalData = async () => {
        setFetchingGoal(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${apiUrl}api/savings-goals/${id}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    return;
                }
                throw new Error('Failed to fetch goal data');
            }

            const goal = await response.json();
            setFormData({
                name: goal.name,
                target_amount: goal.target_amount.toString(),
                monthly_contribution: goal.monthly_contribution.toString(),
                deadline: goal.deadline || ''
            });
        } catch (err) {
            console.error('Error fetching goal:', err);
            toast.error('Failed to load goal data', {
                position: "top-center",
                autoClose: 3000,
                theme: "colored"
            });
            navigate('/savings-goals');
        } finally {
            setFetchingGoal(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e, forceCreate = false) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate form data
            if (!formData.name.trim()) {
                throw new Error('Goal name is required');
            }
            if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
                throw new Error('Target amount must be greater than 0');
            }
            if (!formData.monthly_contribution || parseFloat(formData.monthly_contribution) <= 0) {
                throw new Error('Monthly contribution must be greater than 0');
            }

            const token = localStorage.getItem('access_token');
            const url = isEditing 
                ? `${apiUrl}api/savings-goals/${id}/`
                : `${apiUrl}api/savings-goals/`;
            
            const method = isEditing ? 'PATCH' : 'POST';

            const submitData = {
                name: formData.name.trim(),
                target_amount: parseInt(formData.target_amount),
                monthly_contribution: parseInt(formData.monthly_contribution),
                deadline: formData.deadline || null,
                force_create: forceCreate
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            const responseData = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    return;
                }
                
                // Check if confirmation is required
                if (responseData.requires_confirmation) {
                    setConfirmationData(responseData);
                    setShowConfirmDialog(true);
                    setLoading(false);
                    return;
                }
                
                throw new Error(responseData.error || responseData.message || 'Failed to save goal');
            }

            // Show success message with contribution info
            const successMessage = isEditing 
                ? 'Savings goal updated successfully!' 
                : `Savings goal created successfully! First contribution of ${responseData.contribution_amount} Ft has been deducted from your balance.`;
            
            toast.success(successMessage, {
                position: "top-center",
                autoClose: 5000,
                theme: "colored"
            });

            navigate('/savings-goals');
        } catch (err) {
            console.error('Error saving goal:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCreate = (e) => {
        e.preventDefault();
        setShowConfirmDialog(false);
        handleSubmit(e, true);
    };

    const handleCancelCreate = () => {
        setShowConfirmDialog(false);
        setConfirmationData(null);
        setLoading(false);
    };

    // Calculate estimated completion date
    const getEstimatedCompletion = () => {
        if (!formData.target_amount || !formData.monthly_contribution) return null;
        
        const target = parseFloat(formData.target_amount);
        const monthly = parseFloat(formData.monthly_contribution);
        
        if (target <= 0 || monthly <= 0) return null;
        
        const monthsNeeded = Math.ceil(target / monthly);
        const completionDate = new Date();
        completionDate.setMonth(completionDate.getMonth() + monthsNeeded);
        
        return {
            months: monthsNeeded,
            date: completionDate.toLocaleDateString()
        };
    };

    const estimatedCompletion = getEstimatedCompletion();

    if (fetchingGoal) {
        return <SimpleLayout><p>Loading goal data...</p></SimpleLayout>;
    }

    return (
        <>
            <ToastContainer />
            <SimpleLayout>
                <div className="new-goal-page">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1>{isEditing ? 'Edit Savings Goal' : 'Create New Savings Goal'}</h1>
                        <button 
                            onClick={() => navigate('/savings-goals')}
                            style={{ background: '#6b7280' }}
                        >
                            Back to Goals
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="goal-form">
                        <div className="form-group">
                            <label htmlFor="name">Goal Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Emergency Fund, Vacation, New Car"
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="target_amount">Target Amount (Ft) *</label>
                                <input
                                    type="number"
                                    id="target_amount"
                                    name="target_amount"
                                    value={formData.target_amount}
                                    onChange={handleChange}
                                    placeholder="100000"
                                    required
                                    min="1"
                                    step="1"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="monthly_contribution">Monthly Contribution (Ft) *</label>
                                <input
                                    type="number"
                                    id="monthly_contribution"
                                    name="monthly_contribution"
                                    value={formData.monthly_contribution}
                                    onChange={handleChange}
                                    placeholder="10000"
                                    required
                                    min="1"
                                    step="1"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="deadline">Target Deadline (Optional)</label>
                            <input
                                type="date"
                                id="deadline"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <small>
                                Leave empty if you don't have a specific deadline
                            </small>
                        </div>

                        {estimatedCompletion && (
                            <div className="estimation-info">
                                <h3>Estimation</h3>
                                <div className="estimation-details">
                                    <div>
                                        <strong>Time to complete:</strong> {estimatedCompletion.months} months
                                    </div>
                                    <div>
                                        <strong>Estimated completion:</strong> {estimatedCompletion.date}
                                    </div>
                                    {formData.deadline && (
                                        <div style={{ 
                                            color: new Date(formData.deadline) < new Date(estimatedCompletion.date.split('/').reverse().join('-')) 
                                                ? '#ef4444' : '#10b981'
                                        }}>
                                            {new Date(formData.deadline) < new Date(estimatedCompletion.date.split('/').reverse().join('-'))
                                                ? '⚠️ You may not reach your goal by the deadline with this contribution amount'
                                                : '✅ You should reach your goal before the deadline'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button 
                                type="submit" 
                                disabled={loading}
                                style={{ background: '#10b981' }}
                            >
                                {loading 
                                    ? (isEditing ? 'Updating...' : 'Creating...') 
                                    : (isEditing ? 'Update Goal' : 'Create Goal')
                                }
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate('/savings-goals')}
                                style={{ background: '#6b7280', marginLeft: '10px' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="info-section">
                        <h3>How Automatic Savings Work</h3>
                        <ul>
                            <li>💰 When you create a goal, the first month's contribution is automatically deducted from your balance</li>
                            <li>🛡️ If your monthly contribution is more than 1/3 of your balance, you'll be asked to confirm</li>
                            <li>🎯 You can have up to 3 active savings goals at the same time</li>
                            <li>✅ Goals are automatically marked as completed when the target is reached</li>
                        </ul>
                    </div>
                </div>

                {/* Confirmation Dialog */}
                {showConfirmDialog && confirmationData && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>⚠️ Confirm Savings Goal Creation</h3>
                            <p>{confirmationData.message}</p>
                            <div style={{ margin: '15px 0', background: '#fef3c7', padding: '15px', borderRadius: '5px' }}>
                                <div><strong>Current Balance:</strong> {confirmationData.current_balance.toFixed(2)} Ft</div>
                                <div><strong>Monthly Contribution:</strong> {confirmationData.monthly_contribution} Ft</div>
                                <div><strong>1/3 of Balance:</strong> {confirmationData.one_third_balance} Ft</div>
                            </div>
                            <p style={{ color: '#92400e', fontWeight: 'bold' }}>
                                Do you want to proceed with creating this savings goal?
                            </p>
                            <div className="modal-actions">
                                <button 
                                    onClick={handleConfirmCreate}
                                    style={{ background: '#10b981', marginRight: '10px' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Yes, Create Goal'}
                                </button>
                                <button 
                                    onClick={handleCancelCreate}
                                    style={{ background: '#6b7280' }}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </SimpleLayout>
        </>
    );
}

export default NewSavingGoal;