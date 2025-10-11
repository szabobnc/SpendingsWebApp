import { Chart } from "react-google-charts";

function TransactionPieChart(data) {
    console.log(data);


    const expenseTotals = data.data.filter(e => !e.is_income).reduce((acc, item) => {
        const { category_name, amount } = item;
        acc[category_name] = (acc[category_name] || 0) + amount;
        return acc;
    }, {});

    const expenseData = [["Category", "Amount"], ...Object.entries(expenseTotals)];

    const incomeTotals = data.data.filter(e => e.is_income).reduce((acc, item) => {
        const { category_name, amount } = item;
        acc[category_name] = (acc[category_name] || 0) + amount;
        return acc;
    }, {});

    const incomeData = [["Category", "Amount"], ...Object.entries(incomeTotals)];

    const incomeOption = {
        title: "Income by category",
    };
    const expenseOption = {
        title: "Expense by category",
    };

    return (
        <div className="charts">
            <Chart
                chartType="PieChart"
                data={incomeData}
                options={incomeOption}
                width={"100%"}
                height={"400px"}
            />
            <Chart
                chartType="PieChart"
                data={expenseData}
                options={expenseOption}
                width={"100%"}
                height={"400px"}
            />
        </div>
    );
}

export default TransactionPieChart;