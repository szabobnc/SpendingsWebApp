import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function SetLimit({ onClose }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [existingLimits, setExistingLimits] = useState([]);
  const [details, setDetails] = useState({
    category: "",
    limit_amount: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);

  useEffect(() => {
    fetchCategories();
    checkPremiumStatus();
    fetchExistingLimits();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${apiUrl}api/account/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsPremium(res.data.is_premium);
    } catch (err) {
      console.error("Failed to check premium status:", err);
    } finally {
      setCheckingPremium(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${apiUrl}api/getCategories/?user_id=${user.id}`);
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchExistingLimits = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${apiUrl}api/category-limits/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExistingLimits(res.data);
    } catch (err) {
      console.error("Failed to fetch existing limits:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPremium) {
      alert("This feature is only available for premium users!");
      return;
    }

    if (!details.category || !details.limit_amount) {
      alert("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${apiUrl}api/category-limits/`,
        {
          category: parseInt(details.category),
          limit_amount: parseInt(details.limit_amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const categoryName = categories.find(
        (c) => c.id === parseInt(details.category)
      )?.name;

      alert(
        `Successfully set limit of ${details.limit_amount} Ft for ${categoryName}!`
      );
      
      // Refresh the existing limits
      fetchExistingLimits();
      
      // Reset form
      setDetails({ category: "", limit_amount: "" });
      
      onClose();
    } catch (err) {
      console.error("Failed to set limit:", err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert("Failed to set limit. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLimit = async (limitId) => {
    if (!window.confirm("Are you sure you want to delete this limit?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${apiUrl}api/category-limits/${limitId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      alert("Limit deleted successfully!");
      fetchExistingLimits();
    } catch (err) {
      console.error("Failed to delete limit:", err);
      alert("Failed to delete limit. Please try again.");
    }
  };

  if (checkingPremium) {
    return (
      <div className="overlay">
        <div className="modal">
          <fieldset>
            <p>Checking premium status...</p>
          </fieldset>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="overlay">
        <div className="modal">
          <fieldset>
            <h1>Premium Feature</h1>
            <p style={{ color: "#ff6b6b", marginBottom: "20px" }}>
              Setting category limits is a premium feature. Please upgrade your account to use this functionality.
            </p>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </fieldset>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="modal">
        <fieldset>
          <form onSubmit={handleSubmit}>
            <h1>Set Category Limit</h1>

            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={details.category}
              onChange={(e) => setDetails({ ...details, category: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label htmlFor="limit_amount">Monthly Limit Amount</label>
            <input
              type="number"
              id="limit_amount"
              name="limit_amount"
              value={details.limit_amount}
              onChange={(e) =>
                setDetails({ ...details, limit_amount: e.target.value })
              }
              placeholder="Enter limit amount"
              min="1"
              required
            />

            <div className="button-row">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button
                type="reset"
                onClick={() => setDetails({ category: "", limit_amount: "" })}
              >
                Reset
              </button>
              <button type="button" onClick={onClose}>
                Close
              </button>
            </div>
          </form>

          {existingLimits.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h2>Your Current Limits</h2>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Limit</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {existingLimits.map((limit) => (
                    <tr
                      key={limit.id}
                      className={
                        limit.current_spending?.exceeded
                          ? "neg-tx"
                          : limit.current_spending?.warning
                          ? "warning-tx"
                          : ""
                      }
                    >
                      <td>{limit.category_name}</td>
                      <td>{limit.limit_amount} Ft</td>
                      <td>{limit.current_spending?.total_spent || 0} Ft</td>
                      <td>{limit.current_spending?.remaining || limit.limit_amount} Ft</td>
                      <td>
                        {limit.current_spending?.exceeded
                          ? "⚠️ EXCEEDED"
                          : limit.current_spending?.warning
                          ? "⚠️ WARNING"
                          : `${limit.current_spending?.percentage || 0}%`}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="delete"
                          onClick={() => handleDeleteLimit(limit.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </fieldset>
      </div>
    </div>
  );
}

export default SetLimit;