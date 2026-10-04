function calculateEMI(principal, interestRate, months) {
    if (interestRate === 0) return principal / months;
    let r = (interestRate / 100) / 12;
    let x = Math.pow(1 + r, months);
    return (principal * x * r) / (x - 1);
}

function testLogic(principal, months, annualInterestRate, earlyRepayment) {
    const monthlyInterestRate = (annualInterestRate / 100) / 12;
    let remainingBalance = principal;
    let currentMonthlyPayment = calculateEMI(principal, annualInterestRate, months);
    let month = 1;
    let totalInterestPaid = 0;

    // Simulate what generateAmortizationSchedule does
    while (remainingBalance > 0 && month <= months) {
        let interestPayment = 0;
        let principalPayment = 0;
        let extraPayment = 0;

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

        if (remainingBalance <= 0) break;

        if (extraPayment > 0 && earlyRepayment.strategy === 'emi' && annualInterestRate > 0) {
            const remainingMonths = months - month;
            if (remainingMonths > 0) {
                const x = Math.pow(1 + monthlyInterestRate, remainingMonths);
                currentMonthlyPayment = (remainingBalance * x * monthlyInterestRate) / (x - 1);
            }
        }
        month++;
    }

    return month;
}

const resTerm = testLogic(100000, 12, 10, {
    active: true,
    amount: 1000,
    type: 'recurring',
    month: 1,
    strategy: 'term'
});
console.log("Term strategy with recurring extra payment. End month:", resTerm);

const resEmi = testLogic(100000, 12, 10, {
    active: true,
    amount: 1000,
    type: 'recurring',
    month: 1,
    strategy: 'emi'
});
console.log("EMI strategy with recurring extra payment. End month:", resEmi);
