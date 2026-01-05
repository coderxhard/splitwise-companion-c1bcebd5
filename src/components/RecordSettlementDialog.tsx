import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupMember } from '@/hooks/useGroups';

interface RecordSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  currentUserId: string;
  suggestedSettlement?: { toUserId: string; amount: number } | null;
  onSubmit: (data: { toUserId: string; amount: number; notes?: string }) => void;
  isLoading: boolean;
}

export const RecordSettlementDialog: React.FC<RecordSettlementDialogProps> = ({
  open,
  onOpenChange,
  members,
  currentUserId,
  suggestedSettlement,
  onSubmit,
  isLoading
}) => {
  const [toUserId, setToUserId] = useState(suggestedSettlement?.toUserId || '');
  const [amount, setAmount] = useState(suggestedSettlement?.amount?.toString() || '');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (suggestedSettlement) {
      setToUserId(suggestedSettlement.toUserId);
      setAmount(suggestedSettlement.amount.toString());
    }
  }, [suggestedSettlement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!toUserId || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      toUserId,
      amount: parsedAmount,
      notes: notes.trim() || undefined
    });

    setToUserId('');
    setAmount('');
    setNotes('');
  };

  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Record Settlement</DialogTitle>
          <DialogDescription>
            Record a payment you made to settle a balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>You paid</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profile?.name || member.profile?.email?.split('@')[0] || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-clean"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Paid via UPI"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-clean resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !toUserId || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
