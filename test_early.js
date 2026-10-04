// Simulate generateAmortizationSchedule

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
            principalPayment = remainingBalance;
            // Allow extraPayment to actually pay off the balance without getting zeroed out if it's the driver.
            // Actually, if we overpay, remainingBalance goes to 0.
            // The issue in my logic:
            // if (principalPayment + extraPayment >= remainingBalance)
            // It just caps principalPayment and sets extraPayment to 0. But extraPayment should just be the remainder needed.
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

const resTerm = testLogic(100000, 60, 10, {
    active: true,
    amount: 10000,
    type: 'one-time',
    month: 12,
    strategy: 'term'
});
console.log("Reduced term:", resTerm, "months (expected < 60)");

const resEmi = testLogic(100000, 60, 10, {
    active: true,
    amount: 10000,
    type: 'one-time',
    month: 12,
    strategy: 'emi'
});
console.log("Reduced EMI term:", resEmi, "months (expected 60)");
