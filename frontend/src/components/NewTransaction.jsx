import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_BASE_URL;

function NewTransaction({ onClose , onAdd}) {

    const { user, loading } = useAuth();

    const [isLoading, setLoading] = useState(true);
    const [categories, setCategories] = useState(null);

    const [details, setDetails] = useState({
        user: '',
        is_income: '',
        category: '',
        amount: '',
        date: '',
        description: '',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${apiUrl}api/getCategories/`);
                setCategories(response.data);
            } catch (err) {
                console.error("Failed to load categories:", err);
            } finally {
                setLoading(false);
            }
        };

        initDetails();
        fetchCategories();
    }, [loading]);

    const initDetails = () => {
        if (!loading && user) {
            setDetails({
                user: user.id,
                is_income: '',
                category: '',
                amount: '',
                date: '',
                description: '',
            });
        }
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post(`${apiUrl}api/createTransaction/`, details);
        const savedTx = response.data;

        if (onAdd) onAdd(savedTx); // update Main’s transaction list instantly
        onClose();
    } catch (error) {
        console.error(error);
    }   
};


    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    } else {
        return (
            <div className="overlay">
                <div className="modal">
                    <fieldset>
                        <form onSubmit={handleSubmit}>
                            <h1>Create transaction</h1>
                            <label htmlFor="income">
                                <input type="radio" id="income" name="is_income" value="true" checked={details.is_income === 'true'} onChange={(e) => setDetails({ ...details, is_income: e.target.value })} required/>
                                Income
                            </label>
                            <label htmlFor="expenditure">
                                <input type="radio" id="expenditure" name="is_income" value="false" checked={details.is_income === 'false'} onChange={(e) => setDetails({ ...details, is_income: e.target.value })} required/>
                                Expenditure
                            </label>

                            <label htmlFor="category">Category</label>
                            <select name="category" id="category" onChange={(e) => setDetails({ ...details, category: e.target.value })} required>
                                <option value="" selected>Choose a category </option>
                                {categories.map((c, i) => (
                                    <option value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <label htmlFor="amount">Amount</label>
                            <input type="number" name="amount" id="amount" onChange={(e) => setDetails({ ...details, amount: e.target.value })} required/>

                            <label htmlFor="description">Description</label>
                            <input type="text" name="description" id="description" onChange={(e) => setDetails({ ...details, description: e.target.value })} required/>

                            <button type="submit">Save</button>
                            <button type="reset" onClick={initDetails}>Reset</button>
                            <button onClick={onClose}>Close</button>
                        </form>
                    </fieldset>
                </div>
            </div>
        );
    }
}

export default NewTransaction;