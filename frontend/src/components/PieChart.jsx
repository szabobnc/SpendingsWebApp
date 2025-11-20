import { Chart } from "react-google-charts";
import { useEffect, useState } from "react";

function TransactionPieChart({ data }) {
    console.log(data);
    const [isDark, setIsDark] = useState(false);
    
    // Detect theme changes
    useEffect(() => {
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme');
            setIsDark(theme === 'dark');
        };
        
        checkTheme();
        
        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
        
        return () => observer.disconnect();
    }, []);

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

    // Theme-aware chart colors
const chartColors = isDark
    ? [
        "#8b5cf6", // purple
        "#a78bfa", // light purple
        "#22d3ee", // cyan
        "#f87171", // soft red
        "#fb923c", // orange
        "#c084fc",
        "#34d399"
      ]
    : [
        "#3b82f6", // blue
        "#2563eb", // darker blue
        "#16a34a", // green
        "#dc2626", // red
        "#f59e0b", // amber
        "#60a5fa",
        "#10b981"
      ];


    // Chart options that adapt to theme
    const getChartOptions = (title) => ({
        title: title,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleTextStyle: {
            color: isDark ? '#f8fafc' : '#0f172a',
            fontSize: 16,
            bold: true
        },
        legend: {
            textStyle: {
                color: isDark ? '#cbd5e1' : '#475569',
                fontSize: 12
            }
        },
        pieSliceTextStyle: {
            color: isDark ? '#ffffff' : '#000000',
        },
        chartArea: {
            width: '90%',
            height: '75%'
        },
        tooltip: {
            textStyle: {
                color: isDark ? '#0f172a' : '#0f172a'
            }
        },

        // 👇 Add this
        colors: chartColors
    });

    const incomeOption = getChartOptions("Extra income by category");
    const expenseOption = getChartOptions("Expense by category");

    return (
        <div className="charts">
            {incomeData.length > 1 && (
                <Chart
                    chartType="PieChart"
                    data={incomeData}
                    options={incomeOption}
                    width={"100%"}
                    height={"100%"}
                />
            )}
            {expenseData.length > 1 && (
                <Chart
                    chartType="PieChart"
                    data={expenseData}
                    options={expenseOption}
                    width={"100%"}
                    height={"100%"}
                />
            )}
        </div>
    );
}

export default TransactionPieChart;