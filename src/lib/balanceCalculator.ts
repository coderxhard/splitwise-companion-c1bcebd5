// Net Balance Calculation Algorithm
// Net balance = total paid − total owed
// Positive balance → user will receive money
// Negative balance → user owes money

interface ExpenseData {
  id: string;
  amount: number;
  paid_by: string;
}

interface SplitData {
  expense_id: string;
  user_id: string;
  amount: number;
}

interface UserBalance {
  userId: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export function calculateNetBalances(
  expenses: ExpenseData[],
  splits: SplitData[],
  memberIds: string[]
): Map<string, UserBalance> {
  const balances = new Map<string, UserBalance>();

  // Initialize balances for all members
  memberIds.forEach(userId => {
    balances.set(userId, {
      userId,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0
    });
  });

  // Calculate total paid by each user
  expenses.forEach(expense => {
    const balance = balances.get(expense.paid_by);
    if (balance) {
      balance.totalPaid += expense.amount;
    }
  });

  // Calculate total owed by each user (from splits)
  splits.forEach(split => {
    const balance = balances.get(split.user_id);
    if (balance) {
      balance.totalOwed += split.amount;
    }
  });

  // Calculate net balance for each user
  balances.forEach(balance => {
    balance.netBalance = balance.totalPaid - balance.totalOwed;
  });

  return balances;
}

// Simplified debt settlement using greedy algorithm
export function calculateSettlements(balances: Map<string, UserBalance>): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  balances.forEach(balance => {
    if (balance.netBalance > 0.01) {
      creditors.push({ userId: balance.userId, amount: balance.netBalance });
    } else if (balance.netBalance < -0.01) {
      debtors.push({ userId: balance.userId, amount: Math.abs(balance.netBalance) });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy settlement
  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const settlementAmount = Math.min(creditor.amount, debtor.amount);

    if (settlementAmount > 0.01) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settlementAmount * 100) / 100
      });
    }

    creditor.amount -= settlementAmount;
    debtor.amount -= settlementAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return settlements;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}
