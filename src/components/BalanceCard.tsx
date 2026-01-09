import React from 'react';
import { formatCurrency } from '@/lib/balanceCalculator';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BalanceCardProps {
  userName: string;
  balance: number;
  totalPaid: number;
  totalOwed: number;
  isCurrentUser?: boolean;
  index?: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  userName,
  balance,
  totalPaid,
  totalOwed,
  isCurrentUser = false,
  index = 0
}) => {
  const isPositive = balance > 0.01;
  const isNegative = balance < -0.01;
  const isSettled = !isPositive && !isNegative;

  return (
    <div 
      className={`stat-card opacity-0 animate-fade-in-up ${isCurrentUser ? 'ring-2 ring-primary/20' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-foreground">
            {userName}
            {isCurrentUser && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-fade-in">
                You
              </span>
            )}
          </p>
        </div>
        <div className={`p-2 rounded-lg transition-all duration-300 ${
          isPositive ? 'bg-success/10' : isNegative ? 'bg-destructive/10' : 'bg-muted'
        }`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : isNegative ? (
            <TrendingDown className="h-4 w-4 text-destructive" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Paid</span>
          <span className="font-medium">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Share</span>
          <span className="font-medium">{formatCurrency(totalOwed)}</span>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
            <span className={`text-lg font-bold transition-colors duration-300 ${
              isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {isPositive && '+'}{formatCurrency(balance)}
            </span>
          </div>
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isPositive ? 'text-success' : isNegative ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {isPositive 
              ? 'Will receive money' 
              : isNegative 
                ? 'Owes money' 
                : 'All settled up'}
          </p>
        </div>
      </div>
    </div>
  );
};
