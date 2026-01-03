import React from 'react';
import { Expense, ExpenseSplit } from '@/hooks/useExpenses';
import { GroupMember } from '@/hooks/useGroups';
import { formatCurrency } from '@/lib/balanceCalculator';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ExpenseListProps {
  expenses: Expense[];
  splits: ExpenseSplit[];
  members: GroupMember[];
  currentUserId: string;
  onDelete: (expenseId: string) => void;
  isDeleting: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  splits,
  members,
  currentUserId,
  onDelete,
  isDeleting
}) => {
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.name || member?.profile?.email?.split('@')[0] || 'Unknown';
  };

  const getExpenseSplits = (expenseId: string) => {
    return splits.filter(s => s.expense_id === expenseId);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <span className="text-3xl">💸</span>
        </div>
        <h3 className="font-medium text-foreground mb-1">No expenses yet</h3>
        <p className="text-sm text-muted-foreground">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const expenseSplits = getExpenseSplits(expense.id);
        const paidByName = getMemberName(expense.paid_by);
        const isPaidByCurrentUser = expense.paid_by === currentUserId;

        return (
          <div key={expense.id} className="card-elevated p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground truncate">{expense.title}</h4>
                  {expense.expense_type === 'monthly' && (
                    <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      <RefreshCw className="h-3 w-3" />
                      Monthly
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {isPaidByCurrentUser ? 'You' : paidByName} paid
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {expenseSplits.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Split between:</p>
                    <div className="flex flex-wrap gap-2">
                      {expenseSplits.map((split) => {
                        const splitName = getMemberName(split.user_id);
                        const isCurrentUser = split.user_id === currentUserId;
                        return (
                          <span 
                            key={split.id}
                            className={`text-xs px-2 py-1 rounded-full ${
                              isCurrentUser 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCurrentUser ? 'You' : splitName}: {formatCurrency(split.amount)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(expense.amount)}
                </span>
                {isPaidByCurrentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(expense.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
