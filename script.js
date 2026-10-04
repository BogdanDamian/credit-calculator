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

// Add input formatting as you type
const amountInput = document.getElementById('amount');
const extraAmountInput = document.getElementById('extra-amount');
const enableEarlyRepayment = document.getElementById('enable-early-repayment');
const earlyRepaymentSection = document.getElementById('early-repayment-section');
const repaymentType = document.getElementById('repayment-type');
const repaymentMonthGroup = document.getElementById('repayment-month-group');

// Remove formatting before calculation
function getRawNumber(value) {
    return value.replace(/,/g, '');
}

function formatNumberString(value) {
    // Remove non-digits
    return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function handleFormattedInput(e) {
    let cursorPosition = e.target.selectionStart;
    const originalLength = e.target.value.length;

    this.value = formatNumberString(this.value);

    // Set cursor position
    const newLength = this.value.length;
    cursorPosition = cursorPosition + (newLength - originalLength);
    this.setSelectionRange(cursorPosition, cursorPosition);
}

amountInput.addEventListener('input', handleFormattedInput);
extraAmountInput.addEventListener('input', handleFormattedInput);

enableEarlyRepayment.addEventListener('change', function() {
    earlyRepaymentSection.style.display = this.checked ? 'block' : 'none';
});

repaymentType.addEventListener('change', function() {
    repaymentMonthGroup.style.display = this.value === 'one-time' ? 'block' : 'none';
});

// Reset button functionality
document.getElementById('reset-btn').addEventListener('click', function() {
    document.getElementById('loan-form').reset();
    document.getElementById('results').style.display = 'none';
    document.getElementById('schedule-container').style.display = 'none';
    document.getElementById('calculate-btn').style.display = 'block';
    this.style.display = 'none'; // hide reset button
    document.getElementById('early-repayment-section').style.display = 'none';
});

document.getElementById('loan-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get input values
    const amount = parseFloat(getRawNumber(document.getElementById('amount').value));
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
        const baseTotalPayment = monthlyPayment * months;
        const baseTotalInterest = baseTotalPayment - amount;

        let finalTotalInterest = baseTotalInterest;
        let finalMonths = months;

        // Early Repayment Logic
        let scheduleData = null;
        const isEarlyRepayment = enableEarlyRepayment.checked;
        const extraAmount = parseFloat(getRawNumber(extraAmountInput.value)) || 0;

        if (isEarlyRepayment && extraAmount > 0) {
            const repType = repaymentType.value;
            const repMonth = parseInt(document.getElementById('repayment-month').value) || 1;
            const repStrategy = document.getElementById('repayment-strategy').value;

            scheduleData = generateAmortizationSchedule(amount, months, annualInterestRate, monthlyPayment, {
                active: true,
                amount: extraAmount,
                type: repType,
                month: repMonth,
                strategy: repStrategy
            });

            finalTotalInterest = scheduleData.totalInterest;
            finalMonths = scheduleData.totalMonths;

            // Show savings
            const savedInterest = baseTotalInterest - finalTotalInterest;
            const savedMonths = months - finalMonths;

            document.getElementById('saved-interest').innerText = savedInterest.toFixed(2) + ' RON';
            document.getElementById('saved-time').innerText = savedMonths + (savedMonths === 1 ? ' lună' : ' luni');
            document.getElementById('savings-summary').style.display = 'block';
        } else {
            document.getElementById('savings-summary').style.display = 'none';
            scheduleData = generateAmortizationSchedule(amount, months, annualInterestRate, monthlyPayment, { active: false });
        }

        // Display results
        document.getElementById('monthly-payment').innerText = monthlyPayment.toFixed(2) + ' RON';
        document.getElementById('total-payment').innerText = (amount + finalTotalInterest).toFixed(2) + ' RON';
        document.getElementById('total-interest').innerText = finalTotalInterest.toFixed(2) + ' RON';

        // Show the results container
        document.getElementById('results').style.display = 'block';

        // Hide calculate button, show reset button
        document.getElementById('calculate-btn').style.display = 'none';
        document.getElementById('reset-btn').style.display = 'block';

        // Generate Chart
        generateChart(amount, finalTotalInterest, isEarlyRepayment ? (baseTotalInterest - finalTotalInterest) : 0);
    } else {
        alert("Te rugăm să verifici datele introduse.");
    }
});

function generateChart(principal, totalInterest, savedInterest = 0) {
    const ctx = document.getElementById('loanChart').getContext('2d');

    // Destroy existing chart if it exists
    if (loanChartInstance) {
        loanChartInstance.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e0e0' : '#333333';

    const labels = ['Principal', 'Dobândă Plătită'];
    const data = [principal, totalInterest];
    const bgColors = ['#5c6bc0', '#ff9800'];

    if (savedInterest > 0.01) {
        labels.push('Dobândă Economisită');
        data.push(savedInterest);
        bgColors.push('#4caf50');
    }

    loanChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bgColors,
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

function generateAmortizationSchedule(principal, months, annualInterestRate, monthlyPayment, earlyRepayment) {
    const tableBody = document.querySelector('#amortization-table tbody');
    tableBody.innerHTML = ''; // Clear previous data

    let remainingBalance = principal;
    const monthlyInterestRate = (annualInterestRate / 100) / 12;

    let currentMonthlyPayment = monthlyPayment;
    let totalInterestPaid = 0;
    let month = 1;

    while (remainingBalance > 0 && month <= months) {
        let interestPayment = 0;
        let principalPayment = 0;
        let extraPayment = 0;

        // Calculate early repayment for this month
        if (earlyRepayment.active) {
            if (earlyRepayment.type === 'recurring') {
                extraPayment = earlyRepayment.amount;
            } else if (earlyRepayment.type === 'one-time' && month === earlyRepayment.month) {
                extraPayment = earlyRepayment.amount;
            }
        }

        if (annualInterestRate === 0) {
            principalPayment = currentMonthlyPayment;
        } else {
            interestPayment = remainingBalance * monthlyInterestRate;
            principalPayment = currentMonthlyPayment - interestPayment;
        }

        // Adjust if final payment is larger than remaining balance
        if (principalPayment + extraPayment >= remainingBalance) {
            extraPayment = remainingBalance - principalPayment;
            if (extraPayment < 0) {
                principalPayment = remainingBalance;
                extraPayment = 0;
            }
            remainingBalance = 0;
            currentMonthlyPayment = principalPayment + interestPayment;
        } else {
            remainingBalance -= (principalPayment + extraPayment);
        }

        totalInterestPaid += interestPayment;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td>${currentMonthlyPayment.toFixed(2)}</td>
            <td>${extraPayment > 0 ? extraPayment.toFixed(2) : '-'}</td>
            <td>${principalPayment.toFixed(2)}</td>
            <td>${interestPayment.toFixed(2)}</td>
            <td>${remainingBalance.toFixed(2)}</td>
        `;

        tableBody.appendChild(row);

        if (remainingBalance <= 0) break;

        // Recalculate EMI if strategy is 'emi' and we made an extra payment
        if (extraPayment > 0 && earlyRepayment.strategy === 'emi' && annualInterestRate > 0) {
            const remainingMonths = months - month;
            if (remainingMonths > 0) {
                const x = Math.pow(1 + monthlyInterestRate, remainingMonths);
                currentMonthlyPayment = (remainingBalance * x * monthlyInterestRate) / (x - 1);
            }
        }

        month++;
    }

    document.getElementById('schedule-container').style.display = 'block';
    document.getElementById('export-pdf').style.display = 'block';

    return {
        totalInterest: totalInterestPaid,
        totalMonths: Math.min(month, months)
    };
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

    let savingsHtml = '';
    const savingsSummary = document.getElementById('savings-summary');
    if (savingsSummary.style.display !== 'none') {
        const savedInterest = document.getElementById('saved-interest').innerText;
        const savedTime = document.getElementById('saved-time').innerText;
        savingsHtml = `
            <div style="margin-bottom: 30px; padding: 15px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid #4caf50; border-radius: 4px;">
                <h4 style="color: #4caf50; margin-bottom: 10px; margin-top: 0;">Economii prin rambursare anticipată</h4>
                <p><strong>Dobândă economisită:</strong> ${savedInterest}</p>
                <p><strong>Timp redus:</strong> ${savedTime}</p>
            </div>
        `;
    }

    wrapper.innerHTML = `
        <h1 style="text-align: center; color: #5c6bc0; margin-bottom: 20px;">Grafic de Rambursare</h1>
        <div style="margin-bottom: ${savingsHtml ? '15px' : '30px'}; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Suma împrumutată:</strong> ${amount} RON</p>
            <p><strong>Perioada:</strong> ${period} ${periodType}</p>
            <p><strong>Dobânda anuală:</strong> ${interest}%</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
            <p><strong>Rata lunară de bază:</strong> <span style="color: #5c6bc0; font-weight: bold;">${monthlyPayment}</span></p>
            <p><strong>Total de plată estimat:</strong> ${totalPayment}</p>
        </div>
        ${savingsHtml}
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
