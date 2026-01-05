import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settlement } from '@/hooks/useSettlements';
import { GroupMember } from '@/hooks/useGroups';
import { formatCurrency } from '@/lib/balanceCalculator';
import { ArrowRight, Trash2, Calendar, MessageSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SettlementHistoryProps {
  settlements: Settlement[];
  members: GroupMember[];
  currentUserId: string;
  onDelete: (settlementId: string) => void;
  isDeleting: boolean;
}

export const SettlementHistory: React.FC<SettlementHistoryProps> = ({
  settlements,
  members,
  currentUserId,
  onDelete,
  isDeleting
}) => {
  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    if (!member) return 'Unknown';
    return member.profile?.name || member.profile?.email?.split('@')[0] || 'Unknown';
  };

  if (settlements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No settlements yet</h3>
        <p className="text-sm text-muted-foreground">
          Record a payment when you settle up with a group member
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement) => {
        const isFromCurrentUser = settlement.from_user_id === currentUserId;
        const fromName = getMemberName(settlement.from_user_id);
        const toName = getMemberName(settlement.to_user_id);

        return (
          <Card key={settlement.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${isFromCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {isFromCurrentUser ? 'You' : fromName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className={`font-medium ${!isFromCurrentUser && settlement.to_user_id === currentUserId ? 'text-primary' : 'text-foreground'}`}>
                      {settlement.to_user_id === currentUserId ? 'You' : toName}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {formatCurrency(settlement.amount)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(settlement.settled_at), 'MMM d, yyyy')}
                    </span>
                    {settlement.notes && (
                      <span className="flex items-center gap-1 truncate">
                        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{settlement.notes}</span>
                      </span>
                    )}
                  </div>
                </div>

                {isFromCurrentUser && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete settlement?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the settlement record. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(settlement.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
