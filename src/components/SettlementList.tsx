import React from 'react';
import { formatCurrency } from '@/lib/balanceCalculator';
import { ArrowRight } from 'lucide-react';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettlementListProps {
  settlements: Settlement[];
  memberNames: Map<string, string>;
  currentUserId: string;
}

export const SettlementList: React.FC<SettlementListProps> = ({
  settlements,
  memberNames,
  currentUserId
}) => {
  if (settlements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-3">
          <span className="text-2xl">✓</span>
        </div>
        <p className="text-muted-foreground">All settled up!</p>
        <p className="text-sm text-muted-foreground mt-1">No payments needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement, index) => {
        const fromName = memberNames.get(settlement.from) || 'Unknown';
        const toName = memberNames.get(settlement.to) || 'Unknown';
        const isCurrentUserInvolved = settlement.from === currentUserId || settlement.to === currentUserId;
        const currentUserOwes = settlement.from === currentUserId;
        const currentUserReceives = settlement.to === currentUserId;

        return (
          <div 
            key={index} 
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              isCurrentUserInvolved 
                ? currentUserOwes
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-success/5 border-success/20'
                : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${currentUserOwes ? 'text-destructive' : ''}`}>
                  {settlement.from === currentUserId ? 'You' : fromName}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className={`font-medium ${currentUserReceives ? 'text-success' : ''}`}>
                  {settlement.to === currentUserId ? 'You' : toName}
                </span>
              </div>
            </div>
            <span className={`font-bold text-lg ${
              currentUserOwes ? 'text-destructive' : currentUserReceives ? 'text-success' : ''
            }`}>
              {formatCurrency(settlement.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
