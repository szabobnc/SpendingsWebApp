import { useState } from "react";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function NewCategory({ onClose }) {
  const [details, setDetails] = useState({
    name: "",
    description: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}api/createCategory/`, details);
      onClose(); // Close the modal after success
    } catch (err) {
      console.error("Failed to create category:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <fieldset>
          <form onSubmit={handleSubmit}>
            <h1>Create New Category</h1>

            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              required
            />

            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              name="description"
              value={details.description}
              onChange={(e) =>
                setDetails({ ...details, description: e.target.value })
              }
              placeholder="Optional description..."
            />

            <div className="button-row">
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button type="reset" onClick={() => setDetails({ name: "", description: "" })}>
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

export default NewCategory;
