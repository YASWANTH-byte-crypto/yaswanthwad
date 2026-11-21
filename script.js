
let allowance = 5000;

let transactions = JSON.parse(
    localStorage.getItem("paisaTransactions") || "[]"
);

let expenseChart;
let heroChart;

document.getElementById("date").value =
    new Date().toISOString().split("T")[0];

function saveData() {
    localStorage.setItem(
        "paisaTransactions",
        JSON.stringify(transactions)
    );
}

function addTransaction() {
    let merchant = document.getElementById("merchant").value.trim();
    let amount = Number(document.getElementById("amount").value);
    let type = document.getElementById("type").value;
    let category = document.getElementById("category").value;
    let payment = document.getElementById("payment").value;
    let date = document.getElementById("date").value;

    if (!merchant || amount <= 0 || !date || !Number.isFinite(amount)) {
        alert("Please enter valid transaction details.");
        return;
    }

    transactions.push({
        id: Date.now(),
        merchant,
        amount,
        type,
        category,
        payment,
        date
    });

    saveData();

    document.getElementById("merchant").value = "";
    document.getElementById("amount").value = "";

    updateDashboard();

    alert("Transaction added successfully!");
}

function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    transactions = transactions.filter(t => t.id !== id);

    saveData();
    updateDashboard();
}

function updateDashboard() {
    let income = transactions
        .filter(t => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

    let expenses = transactions
        .filter(t => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

    let balance = allowance + income - expenses;

    document.getElementById("income").textContent =
        "₹" + income.toFixed(2);

    document.getElementById("expenses").textContent =
        "₹" + expenses.toFixed(2);

    document.getElementById("balance").textContent =
        "₹" + balance.toFixed(2);

    document.getElementById("allowanceDisplay").textContent =
        "₹" + allowance.toFixed(2);

    document.getElementById("heroBalance").textContent =
        "₹" + balance.toFixed(2);

    document.getElementById("heroIncome").textContent =
        "₹" + income.toFixed(2);

    document.getElementById("heroExpense").textContent =
        "₹" + expenses.toFixed(2);

    document.getElementById("heroSavings").textContent =
        "₹" + balance.toFixed(2);

    updateCharts();
    render();
}

function updateCharts() {
    const categories = [
        "Food", "Books", "Rent", "Entertainment",
        "Utilities", "Transport", "Other"
    ];

    const values = categories.map(category =>
        transactions
            .filter(t => t.type === "Expense" && t.category === category)
            .reduce((sum, t) => sum + t.amount, 0)
    );

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(
        document.getElementById("expenseChart"),
        {
            type: "doughnut",
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        "#168c88", "#49b8d0", "#f3b45e",
                        "#e87991", "#7d83db", "#65b98d", "#aab7c4"
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        }
    );

    if (heroChart) heroChart.destroy();

    heroChart = new Chart(
        document.getElementById("heroChart"),
        {
            type: "line",
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [{
                    label: "Money balance",
                    data: [
                        allowance,
                        allowance * .95,
                        allowance * .9,
                        allowance * .94,
                        allowance * .87,
                        Math.max(0, allowance + transactions
                            .filter(t => t.type === "Income")
                            .reduce((s, t) => s + t.amount, 0) -
                            transactions.filter(t => t.type === "Expense")
                            .reduce((s, t) => s + t.amount, 0))
                    ],
                    borderColor: "#72e5d4",
                    backgroundColor: "rgba(114,229,212,.15)",
                    fill: true,
                    tension: .4
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: "white" },
                        grid: { display: false }
                    },
                    y: {
                        ticks: { color: "white" },
                        grid: { color: "#ffffff22" }
                    }
                }
            }
        }
    );
}

function render() {
    let search = document.getElementById("search").value.toLowerCase();
    let filter = document.getElementById("filter").value;

    let list = document.getElementById("transactionList");

    let filtered = transactions.filter(t =>
        t.merchant.toLowerCase().includes(search) &&
        (filter === "All" || t.type === filter)
    );

    list.innerHTML = "";

    if (filtered.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center">
                    No transactions found.
                </td>
            </tr>`;
        return;
    }

    filtered.slice().reverse().forEach(t => {
        let tr = document.createElement("tr");

        let values = [
            t.merchant,
            t.category,
            t.date,
            t.payment,
            t.type,
            (t.type === "Income" ? "+ ₹" : "- ₹") + t.amount.toFixed(2)
        ];

        values.forEach((value, index) => {
            let td = document.createElement("td");
            td.textContent = value;

            if (index === 4 || index === 5) {
                td.style.color =
                    t.type === "Income" ? "#168c88" : "#df626d";
            }

            tr.appendChild(td);
        });

        let action = document.createElement("td");
        let button = document.createElement("button");

        button.textContent = "Delete";
        button.className = "delete";
        button.onclick = () => deleteTransaction(t.id);

        action.appendChild(button);
        tr.appendChild(action);
        list.appendChild(tr);
    });
}

function exportCSV() {
    if (!transactions.length) {
        alert("No transactions to export.");
        return;
    }

    let rows = [
        ["Description", "Amount", "Type", "Category", "Payment", "Date"],
        ...transactions.map(t => [
            t.merchant, t.amount, t.type, t.category, t.payment, t.date
        ])
    ];

    let csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    let blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");

    link.href = url;
    link.download = "PaisaPilot_Report.csv";
    link.click();

    URL.revokeObjectURL(url);
}

updateDashboard();
