// --- DOM Elements ---
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');
const expenseTableBody = document.querySelector('#expense-table tbody');
const totalFilteredExpensesSpan = document.getElementById('total-filtered-expenses');
const categoryTotalsList = document.getElementById('category-totals-list');

const filterDateRangeSelect = document.getElementById('filter-date-range');
const filterStartDateInput = document.getElementById('filter-start-date');
const filterEndDateInput = document.getElementById('filter-end-date');

const categoryPieChartCanvas = document.getElementById('categoryPieChart');
const dailyBarChartCanvas = document.getElementById('dailyBarChart');
const pieChartLegend = document.getElementById('pie-chart-legend');

const themeToggleBtn = document.getElementById('theme-toggle');
const currencySelect = document.getElementById('currency');

const monthlyBudgetInput = document.getElementById('monthly-budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetAmountSpan = document.getElementById('budget-amount');
const spentThisMonthSpan = document.getElementById('spent-this-month');
const remainingBudgetSpan = document.getElementById('remaining-budget');
const budgetStatusParagraph = document.getElementById('budget-status');

const exportJsonBtn = document.getElementById('export-json-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');


// --- State Variables ---
let expenses = [];
let currentCurrency = localStorage.getItem('currency') || '$';
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
let currentFilter = { range: 'all', startDate: null, endDate: null };
let chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966CC',
    '#FF9F40', '#a3e635', '#e879f9', '#facc15', '#fb7185'
];


// --- Local Storage ---
const saveExpenses = () => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
};

const loadExpenses = () => {
    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses).map(exp => ({
             ...exp,
             // Ensure amount is number and date is Date object or parseable string if needed later
             amount: parseFloat(exp.amount),
             date: exp.date // Keep as string 'YYYY-MM-DD' for easier input/comparison
        }));
    } else {
        expenses = [];
    }
};

const saveSettings = () => {
    localStorage.setItem('currency', currentCurrency);
    localStorage.setItem('monthlyBudget', monthlyBudget);
};

const loadSettings = () => {
    currentCurrency = localStorage.getItem('currency') || '$';
    monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;

    currencySelect.value = currentCurrency;
    monthlyBudgetInput.value = monthlyBudget;

    // Load theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>'; // Change icon to sun
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>'; // Change icon to moon
    }
};

// --- Helper Functions ---

const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
};

const getDatesForRange = (range) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    let startDate, endDate;

    switch (range) {
        case 'all':
            startDate = null;
            endDate = null;
            break;
        case 'today':
            startDate = new Date(now);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999); // End of today
            break;
        case 'week':
            const firstDayOfWeek = now.getDate() - now.getDay(); // Sunday as first day
            startDate = new Date(now.setDate(firstDayOfWeek));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
             endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
             endDate.setHours(23, 59, 59, 999);
            break;
         case 'custom':
             // Handled by input values
             startDate = filterStartDateInput.value ? new Date(filterStartDateInput.value) : null;
             endDate = filterEndDateInput.value ? new Date(filterEndDateInput.value) : null;
             if(endDate) endDate.setHours(23, 59, 59, 999); // Include the end date fully
            break;
        default:
            startDate = null;
            endDate = null;
    }

    // Convert dates back to YYYY-MM-DD strings for comparison with expense dates
     const dateToYYYYMMDD = (date) => date ? date.toISOString().split('T')[0] : null;

    return {
        startDate: startDate ? dateToYYYYDDMM(startDate) : null, // Use a helper for consistent string format
        endDate: endDate ? dateToYYYYDDMM(endDate) : null
    };
};

// Helper to format Date object to YYYY-MM-DD string
const dateToYYYYDDMM = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


// --- Rendering Functions ---

const renderExpenses = () => {
    expenseTableBody.innerHTML = ''; // Clear current list

    // Apply filter
    const { startDate, endDate } = currentFilter;
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = expense.date; // Already YYYY-MM-DD

        if (startDate && expenseDate < startDate) return false;
        if (endDate && expenseDate > endDate) return false; // Compare strings directly

        return true;
    });

    if (filteredExpenses.length === 0) {
        expenseTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No expenses found for this period.</td></tr>';
    } else {
        filteredExpenses.forEach(expense => {
            const row = expenseTableBody.insertRow();
            row.dataset.id = expense.id; // Store ID on the row

            // Date Cell (Editable)
            const dateCell = row.insertCell(0);
            dateCell.textContent = formatDate(expense.date);
            dateCell.dataset.field = 'date';
            dateCell.contentEditable = true;

            // Amount Cell (Editable)
            const amountCell = row.insertCell(1);
            amountCell.textContent = `${currentCurrency} ${expense.amount.toFixed(2)}`;
            amountCell.dataset.field = 'amount';
            amountCell.dataset.value = expense.amount; // Store raw value
             amountCell.contentEditable = true;

            // Category Cell (Editable - though dropdown is better, contenteditable is simpler here)
            const categoryCell = row.insertCell(2);
            categoryCell.textContent = expense.category;
             categoryCell.dataset.field = 'category';
             categoryCell.contentEditable = true; // Simple text edit, not a dropdown

            // Notes Cell (Editable)
            const notesCell = row.insertCell(3);
            notesCell.textContent = expense.notes || '';
             notesCell.dataset.field = 'notes';
             notesCell.contentEditable = true;


            // Actions Cell
            const actionsCell = row.insertCell(4);
            actionsCell.classList.add('actions-cell');
            actionsCell.innerHTML = `
                <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
            `;
        });
    }

     updateSummary(filteredExpenses);
     renderCharts(filteredExpenses);
     updateBudgetSummary(); // Always update budget based on *this month*
};

const updateSummary = (filteredExpenses) => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalFilteredExpensesSpan.textContent = `${currentCurrency} ${total.toFixed(2)}`;

    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    categoryTotalsList.innerHTML = '';
    Object.entries(categoryTotals).forEach(([category, amount]) => {
        const li = document.createElement('li');
        li.textContent = `${category}: ${currentCurrency} ${amount.toFixed(2)}`;
        categoryTotalsList.appendChild(li);
    });
};

const updateBudgetSummary = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

     // Filter expenses for the current calendar month
    const spentThisMonth = expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date); // Convert YYYY-MM-DD to Date object
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

    const remaining = monthlyBudget - spentThisMonth;

    budgetAmountSpan.textContent = `${currentCurrency} ${monthlyBudget.toFixed(2)}`;
    spentThisMonthSpan.textContent = `${currentCurrency} ${spentThisMonth.toFixed(2)}`;
    remainingBudgetSpan.textContent = `${currentCurrency} ${remaining.toFixed(2)}`;

    // Update status
    budgetStatusParagraph.textContent = ''; // Clear previous status
    budgetStatusParagraph.classList.remove('over', 'under');
    if (monthlyBudget > 0) {
        if (remaining < 0) {
             budgetStatusParagraph.textContent = 'Over Budget!';
             budgetStatusParagraph.classList.add('over');
        } else {
             budgetStatusParagraph.textContent = 'Under Budget';
             budgetStatusParagraph.classList.add('under');
        }
    }

};


// --- Chart Rendering (Using HTML Canvas) ---

const renderCharts = (filteredExpenses) => {
    // Pie Chart by Category
    const categoryData = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    drawPieChart(categoryPieChartCanvas, categories, amounts, totalAmount);
    updatePieChartLegend(categories, amounts, totalAmount);

    // Bar Chart: Daily Spending
    const dailyData = filteredExpenses.reduce((acc, expense) => {
        const date = expense.date; // YYYY-MM-DD
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});

    // Sort dates for the bar chart
    const sortedDates = Object.keys(dailyData).sort();
    const dailyAmounts = sortedDates.map(date => dailyData[date]);

    drawBarChart(dailyBarChartCanvas, sortedDates.map(formatDate), dailyAmounts); // Format dates for display
};


// Helper function to draw a pie chart
const drawPieChart = (canvas, labels, data, total) => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing

    if (total === 0) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data for chart', canvas.width / 2, canvas.height / 2);
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.7; // Use 70% of the minimum dimension

    let startAngle = 0;

    data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const color = chartColors[index % chartColors.length]; // Cycle through colors

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();

        // Optional: Add text label on slice (can be complex for small slices)
        // For simplicity, we rely on the legend

        startAngle += sliceAngle;
    });
};

// Helper function to update pie chart legend
const updatePieChartLegend = (labels, data, total) => {
    pieChartLegend.innerHTML = '';
     if (total === 0) return;

    labels.forEach((label, index) => {
        const amount = data[index];
        const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
        const color = chartColors[index % chartColors.length];

        const li = document.createElement('li');
        li.innerHTML = `
            <span class="legend-color-box" style="background-color: ${color};"></span>
            ${label}: ${currentCurrency} ${amount.toFixed(2)} (${percentage}%)
        `;
        pieChartLegend.appendChild(li);
    });
};


// Helper function to draw a bar chart (Daily Spending)
const drawBarChart = (canvas, labels, data) => {
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing

     if (data.length === 0 || data.every(val => val === 0)) {
         ctx.font = '16px Arial';
         ctx.textAlign = 'center';
         ctx.fillText('No data for chart', canvas.width / 2, canvas.height / 2);
         return;
     }

     const padding = 20;
     const chartWidth = canvas.width - 2 * padding;
     const chartHeight = canvas.height - 2 * padding - 30; // Leave space for labels

     const maxValue = Math.max(...data);
     const numBars = data.length;
     const barWidth = chartWidth / numBars * 0.6; // 60% width, 40% gap
     const barGap = chartWidth / numBars * 0.4;

     // Draw Y-axis (simple line)
     ctx.beginPath();
     ctx.moveTo(padding, padding);
     ctx.lineTo(padding, padding + chartHeight);
     ctx.strokeStyle = varToRgba('--text-color', 0.5); // Use text color with some transparency
     ctx.stroke();

     // Draw X-axis (simple line)
     ctx.beginPath();
     ctx.moveTo(padding, padding + chartHeight);
     ctx.lineTo(padding + chartWidth, padding + chartHeight);
     ctx.stroke();


     // Draw Bars
     ctx.fillStyle = varToRgba('--accent-color'); // Use accent color for bars
     data.forEach((value, index) => {
         const barHeight = (value / maxValue) * chartHeight;
         const x = padding + barGap / 2 + index * (barWidth + barGap);
         const y = padding + chartHeight - barHeight;

         ctx.fillRect(x, y, barWidth, barHeight);

         // Draw X-axis labels (dates) - simplify if too many
         if (numBars <= 15 || index % Math.ceil(numBars / 15) === 0) { // Limit number of labels
             ctx.font = '10px Arial';
             ctx.textAlign = 'center';
             ctx.fillStyle = varToRgba('--text-color');
             // Rotate text for better readability if needed
             ctx.save();
             ctx.translate(x + barWidth / 2, padding + chartHeight + 5); // Move origin to base of bar
             ctx.rotate(Math.PI / 4); // Rotate 45 degrees
             ctx.fillText(labels[index], 0, 0);
             ctx.restore();
         }

          // Draw value text on top of bar
          if (value > 0 && barHeight > 15) { // Only draw if bar is tall enough
               ctx.font = '10px Arial';
               ctx.textAlign = 'center';
               ctx.fillStyle = varToRgba('--card-bg'); // White text on bars usually works
               ctx.fillText(value.toFixed(0), x + barWidth / 2, y + 10);
          }
     });

     // Draw Y-axis label (optional) and maybe a max value indicator
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = varToRgba('--text-color');
      ctx.fillText(maxValue.toFixed(0), padding - 5, padding + 10); // Max value near top left

};

// Helper to get CSS variable value and optionally convert to RGBA for Canvas
const varToRgba = (varName, alpha = 1) => {
    const style = getComputedStyle(document.body);
    let color = style.getPropertyValue(varName).trim();

    // Simple check if it's a hex color (e.g., #RRGGBB or #RGB)
    if (color.startsWith('#')) {
        if (color.length === 4) { // #RGB
            color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
     // Handle rgb() or rgba() directly if needed, otherwise return as is (might fail for Canvas)
     // For simplicity, this helper assumes simple hex or color names that Canvas understands.
     // More robust parsing would be needed for full CSS color support.
     return color; // Canvas might understand some named colors
};


// --- Event Listeners ---

// Add Expense Form Submit
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value; // YYYY-MM-DD format
    const notes = notesInput.value.trim();

    if (isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Please enter a valid amount, category, and date.');
        return;
    }

    const newExpense = {
        id: Date.now(), // Simple unique ID
        amount: amount,
        category: category,
        date: date,
        notes: notes,
    };

    expenses.push(newExpense);
    saveExpenses();
    renderExpenses(); // Re-render list, summary, charts
    updateBudgetSummary(); // Update budget display

    // Clear form
    expenseForm.reset();
    dateInput.valueAsDate = new Date(); // Reset date to today
});


// Filter Controls
filterDateRangeSelect.addEventListener('change', (e) => {
    const range = e.target.value;
    const customInputs = document.querySelectorAll('.custom-filter');

    if (range === 'custom') {
        customInputs.forEach(input => input.style.display = 'inline-block');
    } else {
        customInputs.forEach(input => input.style.display = 'none');
        const { startDate, endDate } = getDatesForRange(range);
        currentFilter = { range, startDate, endDate };
        renderExpenses(); // Re-render list, summary, charts based on new filter
    }
});

// Custom Date Filter Input Changes
filterStartDateInput.addEventListener('change', () => {
     if (filterDateRangeSelect.value === 'custom') {
         currentFilter = {
             range: 'custom',
             startDate: filterStartDateInput.value,
             endDate: filterEndDateInput.value
         };
         renderExpenses();
     }
});
filterEndDateInput.addEventListener('change', () => {
     if (filterDateRangeSelect.value === 'custom') {
         currentFilter = {
             range: 'custom',
             startDate: filterStartDateInput.value,
             endDate: filterEndDateInput.value
         };
         renderExpenses();
     }
});


// Edit & Delete Actions (using event delegation on the table body)
expenseTableBody.addEventListener('click', (e) => {
    const target = e.target;
    const row = target.closest('tr');
    if (!row) return; // Not a table row

    const expenseId = parseInt(row.dataset.id);

    // Delete Button
    if (target.classList.contains('delete-btn') || target.parentElement.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(expense => expense.id !== expenseId);
            saveExpenses();
            renderExpenses(); // Re-render list, summary, charts
            updateBudgetSummary(); // Update budget display
        }
    }
});

// Editable Cell Saving (using event delegation on the table body)
expenseTableBody.addEventListener('blur', (e) => {
     const target = e.target;
     // Check if the target is an editable cell within a row
     if (target.contentEditable === 'true' && target.closest('tr')) {
         const row = target.closest('tr');
         const expenseId = parseInt(row.dataset.id);
         const field = target.dataset.field;
         let newValue = target.textContent.trim();

         const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
         if (expenseIndex === -1) return; // Expense not found

         let updatedValue = newValue;

         // Basic validation/parsing based on field
         if (field === 'amount') {
             // Remove currency symbol and parse as float
             const cleanedValue = newValue.replace(currentCurrency, '').trim();
             updatedValue = parseFloat(cleanedValue);
             if (isNaN(updatedValue) || updatedValue < 0) {
                 alert('Invalid amount.');
                 // Revert the cell content to the last valid value
                 target.textContent = `${currentCurrency} ${expenses[expenseIndex].amount.toFixed(2)}`;
                 return;
             }
         } else if (field === 'date') {
             // Validate YYYY-MM-DD format (or whatever date picker outputs)
             // For simplicity, assume date picker input gives YYYY-MM-DD.
             // If editing text, need more robust validation.
             // A simple check if it looks like a date:
             const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
             // If the original input was 'MM/DD/YYYY' format from renderExpenses,
             // we need to parse that back to 'YYYY-MM-DD' before saving.
             // Let's adjust renderExpenses to put YYYY-MM-DD in a data attribute
             // and display MM/DD/YYYY, then read from data attribute on blur.
             // OR, just keep YYYY-MM-DD in the cell text for easier editing/saving if format is required.
             // Let's keep YYYY-MM-DD in the cell for simplicity in this editable demo.
              const [month, day, year] = newValue.split('/');
              updatedValue = `${year}-${month}-${day}`; // Convert MM/DD/YYYY back to YYYY-MM-DD

              if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedValue) || isNaN(new Date(updatedValue).getTime())) {
                  alert('Invalid date format. Please use MM/DD/YYYY.');
                  // Revert the cell content
                  target.textContent = formatDate(expenses[expenseIndex].date);
                  return;
              }

         } else if (field === 'category') {
             // Optional: Validate against allowed categories
             // For this demo, any text is allowed.
             // If dropdown was used, validation is automatic.
         }
         // Notes field doesn't need special validation

         // Update the expense object
         expenses[expenseIndex][field] = updatedValue;

         // If amount was updated, update its raw value data attribute
         if (field === 'amount') {
             target.dataset.value = updatedValue;
             target.textContent = `${currentCurrency} ${updatedValue.toFixed(2)}`; // Re-format displayed value
         } else if (field === 'date') {
              target.textContent = formatDate(updatedValue); // Re-format displayed date
         }


         saveExpenses();
         // Re-render charts and summaries as data has changed
         // Note: A full re-render of the table is also an option after edit for consistency,
         // but blur saves without refreshing the whole table.
         // We need to update affected summaries and charts.
         const filteredExpenses = expenses.filter(expense => {
             const expenseDate = expense.date; // Already YYYY-MM-DD
             const { startDate, endDate } = currentFilter;

             if (startDate && expenseDate < startDate) return false;
             if (endDate && expenseDate > endDate) return false;
             return true;
         });
         updateSummary(filteredExpenses);
         renderCharts(filteredExpenses);
         updateBudgetSummary();
     }
}, true); // Use capture phase to ensure blur is caught


// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggleBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; // Toggle icon
     renderCharts(expenses.filter(expense => { // Re-render charts to pick up new colors
         const expenseDate = expense.date;
         const { startDate, endDate } = currentFilter;
         if (startDate && expenseDate < startDate) return false;
         if (endDate && expenseDate > endDate) return false;
         return true;
     }));
});

// Currency Selection
currencySelect.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    saveSettings();
    // Re-render expenses, summary, budget to show new currency symbol
    renderExpenses();
    updateBudgetSummary();
});


// Set Monthly Budget
setBudgetBtn.addEventListener('click', () => {
    const budget = parseFloat(monthlyBudgetInput.value);
    if (!isNaN(budget) && budget >= 0) {
        monthlyBudget = budget;
        saveSettings();
        updateBudgetSummary();
    } else {
        alert('Please enter a valid budget amount (number >= 0).');
         monthlyBudgetInput.value = monthlyBudget; // Revert input
    }
});


// Export JSON
exportJsonBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(expenses, null, 2); // Pretty print JSON
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.json';
    document.body.appendChild(a); // Append to body to make it clickable in all browsers
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Free up memory
});

// Export CSV
exportCsvBtn.addEventListener('click', () => {
    if (expenses.length === 0) {
        alert('No expenses to export.');
        return;
    }

    const header = ["ID", "Date", "Amount", "Category", "Notes"];
    const rows = expenses.map(exp => [
        exp.id,
        exp.date,
        exp.amount.toFixed(2), // Export amount formatted
        exp.category,
        // Simple CSV escaping for notes: wrap in quotes, escape internal quotes
        `"${exp.notes.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        header.join(','), // Header row
        ...rows.map(row => row.join(',')) // Data rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
     document.body.appendChild(a);
    a.click();
     document.body.removeChild(a);
    URL.revokeObjectURL(url);
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); // Load theme, currency, budget first
    loadExpenses(); // Load expenses
    renderExpenses(); // Render list, summary, charts (which uses current filter)
    updateBudgetSummary(); // Update budget display

    // Set default date in form to today
    dateInput.valueAsDate = new Date();

    // Apply initial filter (e.g., 'all')
    const { startDate, endDate } = getDatesForRange(filterDateRangeSelect.value);
    currentFilter = { range: filterDateRangeSelect.value, startDate, endDate };
    renderExpenses(); // Re-render with applied filter

    // Adjust canvas size for responsive charts (simplified)
     const resizeCharts = () => {
        const chartItems = document.querySelectorAll('.chart-item');
        chartItems.forEach(item => {
             const canvas = item.querySelector('canvas');
             if (canvas) {
                 // Set display size and drawing buffer size
                 // Use parent width, maintain aspect ratio (e.g., 1:1 for pie, 2:1 for bar)
                 const parentWidth = item.offsetWidth;
                 if (canvas.id === 'categoryPieChart') {
                     canvas.width = parentWidth;
                     canvas.height = parentWidth * 0.8; // Slightly less than 1:1
                 } else { // dailyBarChart
                     canvas.width = parentWidth;
                     canvas.height = parentWidth * 0.5; // e.g., 2:1 aspect ratio
                 }
             }
        });
        // Redraw charts after resize
        const filteredExpenses = expenses.filter(expense => {
            const expenseDate = expense.date;
            const { startDate, endDate } = currentFilter;
            if (startDate && expenseDate < startDate) return false;
            if (endDate && expenseDate > endDate) return false;
            return true;
        });
        renderCharts(filteredExpenses);
     };

     // Initial resize
     resizeCharts();
     // Resize on window resize
     window.addEventListener('resize', resizeCharts);

});