import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const handlePayment = () => {
        setTimeout(() => {
            navigate("/account", { state: {paymentSuccess: true}});
        }, 1000);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "100px" }}>
            <h1>Mock Payment page</h1>
            <p>This is a test payment page. The payment always succesful.</p>
            <button
                onClick={handlePayment}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginTop: "20px",
                }}
            >
                Start payment
            </button>
        </div>
    );
}
