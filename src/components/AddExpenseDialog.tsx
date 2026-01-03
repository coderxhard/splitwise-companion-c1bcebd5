import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupMember } from '@/hooks/useGroups';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  onSubmit: (data: {
    title: string;
    amount: number;
    paidBy: string;
    expenseType: 'one-time' | 'monthly';
    expenseDate: string;
    category: string;
    splits: { userId: string; amount: number }[];
  }) => void;
  isLoading: boolean;
}

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'wifi', label: 'WiFi/Internet' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general', label: 'General' },
];

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  open,
  onOpenChange,
  members,
  onSubmit,
  isLoading
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('general');
  const [expenseType, setExpenseType] = useState<'one-time' | 'monthly'>('one-time');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && user) {
      setPaidBy(user.id);
      setSelectedMembers(members.map(m => m.user_id));
    }
  }, [open, user, members]);

  useEffect(() => {
    if (splitType === 'equal' && selectedMembers.length > 0 && amount) {
      const splitAmount = parseFloat(amount) / selectedMembers.length;
      const newSplits: Record<string, string> = {};
      selectedMembers.forEach(id => {
        newSplits[id] = splitAmount.toFixed(2);
      });
      setCustomSplits(newSplits);
    }
  }, [splitType, selectedMembers, amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({ title: 'Please select at least one member', variant: 'destructive' });
      return;
    }

    const splits = selectedMembers.map(userId => ({
      userId,
      amount: parseFloat(customSplits[userId] || '0')
    }));

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - parsedAmount) > 0.01) {
      toast({ 
        title: 'Split amounts must equal total', 
        description: `Total: ₹${parsedAmount}, Split: ₹${totalSplit.toFixed(2)}`,
        variant: 'destructive' 
      });
      return;
    }

    onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      paidBy,
      expenseType,
      expenseDate,
      category,
      splits
    });

    // Reset form
    setTitle('');
    setAmount('');
    setCategory('general');
    setExpenseType('one-time');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setSplitType('equal');
    setSelectedMembers(members.map(m => m.user_id));
    setCustomSplits({});
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.user_id === userId);
    return member?.profile?.name || member?.profile?.email?.split('@')[0] || 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Electricity bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-clean"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-clean"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="input-clean">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="input-clean"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid by</Label>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger className="input-clean">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_id === user?.id ? 'You' : getMemberName(member.user_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={expenseType}
              onValueChange={(value) => setExpenseType(value as 'one-time' | 'monthly')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="font-normal cursor-pointer">One-time</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly (recurring)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Split between</Label>
              <RadioGroup
                value={splitType}
                onValueChange={(value) => setSplitType(value as 'equal' | 'custom')}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal" id="equal" />
                  <Label htmlFor="equal" className="text-xs font-normal cursor-pointer">Equal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="text-xs font-normal cursor-pointer">Custom</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
              {members.map(member => {
                const isSelected = selectedMembers.includes(member.user_id);
                const isCurrentUser = member.user_id === user?.id;
                
                return (
                  <div key={member.user_id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`member-${member.user_id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleMemberToggle(member.user_id)}
                      />
                      <Label 
                        htmlFor={`member-${member.user_id}`} 
                        className="font-normal cursor-pointer"
                      >
                        {isCurrentUser ? 'You' : getMemberName(member.user_id)}
                      </Label>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          value={customSplits[member.user_id] || ''}
                          onChange={(e) => setCustomSplits(prev => ({
                            ...prev,
                            [member.user_id]: e.target.value
                          }))}
                          className="w-20 h-8 text-right input-clean"
                          disabled={splitType === 'equal'}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
