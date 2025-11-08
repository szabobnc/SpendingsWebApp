import { Chart } from "react-google-charts";

function TransactionPieChart({ data }) {
    console.log(data);

    if (!data || data.length === 0) {
        return <div>No transaction data available for charts.</div>;
    }

    const expenseTotals = data.filter(e => !e.is_income).reduce((acc, item) => {
        const { category_name, amount } = item;
        acc[category_name] = (acc[category_name] || 0) + amount;
        return acc;
    }, {});

    const expenseData = [["Category", "Amount"], ...Object.entries(expenseTotals)];

    const incomeTotals = data.filter(e => e.is_income).reduce((acc, item) => {
        const { category_name, amount } = item;
        acc[category_name] = (acc[category_name] || 0) + amount;
        return acc;
    }, {});

    const incomeData = [["Category", "Amount"], ...Object.entries(incomeTotals)];

    const incomeOption = {
        title: "Extrca income by category",
    };
    const expenseOption = {
        title: "Expense by category",
    };

    return (
        <div className="charts">
            {incomeData.length > 1 && (
                <Chart
                    chartType="PieChart"
                    data={incomeData}
                    options={incomeOption}
                    width={"100%"}
                    height={"400px"}
                />
            )}
            {expenseData.length > 1 && (
                <Chart
                    chartType="PieChart"
                    data={expenseData}
                    options={expenseOption}
                    width={"100%"}
                    height={"400px"}
                />
            )}
        </div>
    );
}

export default TransactionPieChart;