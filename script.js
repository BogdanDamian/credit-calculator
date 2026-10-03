let loanChartInstance = null;

// Dark Mode Logic
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
    }
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateChartColors('dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateChartColors('light');
    }
}

toggleSwitch.addEventListener('change', switchTheme, false);

document.getElementById('loan-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get input values
    const amount = parseFloat(document.getElementById('amount').value);
    let periodValue = parseInt(document.getElementById('period').value);
    const periodType = document.getElementById('period-type').value;
    const annualInterestRate = parseFloat(document.getElementById('interest').value);

    // Convert to months if years is selected
    const months = periodType === 'years' ? periodValue * 12 : periodValue;

    let monthlyPayment;

    // Handle 0% interest rate
    if (annualInterestRate === 0) {
        monthlyPayment = amount / months;
    } else {
        // Calculate monthly interest rate
        const monthlyInterestRate = (annualInterestRate / 100) / 12;

        // Calculate EMI (Equated Monthly Installment)
        // Formula: EMI = [P x R x (1+R)^N] / [(1+R)^N-1]
        const x = Math.pow(1 + monthlyInterestRate, months);
        monthlyPayment = (amount * x * monthlyInterestRate) / (x - 1);
    }

    // Check if the result is a finite number
    if (isFinite(monthlyPayment)) {
        const totalPayment = monthlyPayment * months;
        const totalInterest = totalPayment - amount;

        // Display results
        document.getElementById('monthly-payment').innerText = monthlyPayment.toFixed(2) + ' RON';
        document.getElementById('total-payment').innerText = totalPayment.toFixed(2) + ' RON';
        document.getElementById('total-interest').innerText = totalInterest.toFixed(2) + ' RON';

        // Show the results container
        document.getElementById('results').style.display = 'block';

        // Generate Chart
        generateChart(amount, totalInterest);

        // Generate and show the amortization schedule
        generateAmortizationSchedule(amount, months, annualInterestRate, monthlyPayment);
    } else {
        alert("Te rugăm să verifici datele introduse.");
    }
});

function generateChart(principal, totalInterest) {
    const ctx = document.getElementById('loanChart').getContext('2d');

    // Destroy existing chart if it exists
    if (loanChartInstance) {
        loanChartInstance.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';

    loanChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal (Suma împrumutată)', 'Total Dobândă'],
            datasets: [{
                data: [principal, totalInterest],
                backgroundColor: ['#5c6bc0', '#ff9800'],
                borderWidth: 1,
                borderColor: isDarkMode ? '#1e1e1e' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function updateChartColors(theme) {
    if (loanChartInstance) {
        const textColor = theme === 'dark' ? '#e0e0e0' : '#333333';
        const borderColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';

        loanChartInstance.options.plugins.legend.labels.color = textColor;
        loanChartInstance.data.datasets[0].borderColor = borderColor;
        loanChartInstance.update();
    }
}

function generateAmortizationSchedule(principal, months, annualInterestRate, monthlyPayment) {
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    let remainingBalance = principal;
    const monthlyInterestRate = (annualInterestRate / 100) / 12;

    for (let month = 1; month <= months; month++) {
        let interestPayment = 0;
        let principalPayment = 0;

        if (annualInterestRate === 0) {
            principalPayment = monthlyPayment;
        } else {
            interestPayment = remainingBalance * monthlyInterestRate;
            principalPayment = monthlyPayment - interestPayment;
        }

        remainingBalance -= principalPayment;

        // Adjust final month rounding issues
        if (remainingBalance < 0.01) {
            remainingBalance = 0;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td>${monthlyPayment.toFixed(2)}</td>
            <td>${principalPayment.toFixed(2)}</td>
            <td>${interestPayment.toFixed(2)}</td>
            <td>${remainingBalance.toFixed(2)}</td>
        `;

        tableBody.appendChild(row);
    }

    document.getElementById('schedule-container').style.display = 'block';

    // Show the export button
    document.getElementById('export-pdf').style.display = 'block';
}

// Attach event listener for the export PDF button
document.getElementById('export-pdf').addEventListener('click', function() {
    // Create a temporary wrapper to include summary data in the PDF
    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    // Add title and summary
    const amount = document.getElementById('amount').value;
    const period = document.getElementById('period').value;
    const periodType = document.getElementById('period-type').options[document.getElementById('period-type').selectedIndex].text;
    const interest = document.getElementById('interest').value;
    const monthlyPayment = document.getElementById('monthly-payment').innerText;
    const totalPayment = document.getElementById('total-payment').innerText;

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#fff' : '#000';
    const bgColor = isDarkMode ? '#121212' : '#fff';
    wrapper.style.backgroundColor = bgColor;
    wrapper.style.color = textColor;

    wrapper.innerHTML = `
        <h1 style="text-align: center; color: #5c6bc0; margin-bottom: 20px;">Grafic de Rambursare</h1>
        <div style="margin-bottom: 30px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Suma împrumutată:</strong> ${amount} RON</p>
            <p><strong>Perioada:</strong> ${period} ${periodType}</p>
            <p><strong>Dobânda anuală:</strong> ${interest}%</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            <p><strong>Rata lunară:</strong> <span style="color: #5c6bc0; font-weight: bold;">${monthlyPayment}</span></p>
            <p><strong>Total de plată:</strong> ${totalPayment}</p>
        </div>
    `;

    // Clone the table container
    const tableContainer = document.getElementById('schedule-container').cloneNode(true);
    // Remove the export button from the clone
    const clonedBtn = tableContainer.querySelector('#export-pdf');
    if(clonedBtn) clonedBtn.remove();

    wrapper.appendChild(tableContainer);

    const opt = {
        margin:       0.5,
        filename:     'grafic_de_rambursare.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(wrapper).set(opt).save();
});
