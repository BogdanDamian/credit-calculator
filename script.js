document.getElementById('loan-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get input values
    const amount = parseFloat(document.getElementById('amount').value);
    const months = parseInt(document.getElementById('period').value);
    const annualInterestRate = parseFloat(document.getElementById('interest').value);

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

        // Generate and show the amortization schedule
        generateAmortizationSchedule(amount, months, annualInterestRate, monthlyPayment);
    } else {
        alert("Please check your numbers");
    }
});

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
}
