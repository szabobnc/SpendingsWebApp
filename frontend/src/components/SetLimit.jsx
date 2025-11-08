import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function SetLimit({ onClose }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
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
      const res = await axios.get(`${apiUrl}api/categories/`);
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isPremium) {
      alert("This feature is only available for premium users!");
      return;
    }

    setIsLoading(true);
    try {
      // Here you would normally save to backend
      // For now, just show success message
      alert(`Limit of $${details.limit_amount} set for ${categories.find(c => c.id === parseInt(details.category))?.name}`);
      onClose();
    } catch (err) {
      console.error("Failed to set limit:", err);
      alert("Failed to set limit. Please try again.");
    } finally {
      setIsLoading(false);
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
        </fieldset>
      </div>
    </div>
  );
}

export default SetLimit;