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
    } else {
        alert("Please check your numbers");
    }
});
