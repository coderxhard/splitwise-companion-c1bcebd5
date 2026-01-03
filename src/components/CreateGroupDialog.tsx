import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Home, Users, Building } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; type: string }) => void;
  isLoading: boolean;
}

const GROUP_TYPES = [
  { value: 'hostel', label: 'Hostel', icon: Building2 },
  { value: 'pg', label: 'PG', icon: Home },
  { value: 'flat', label: 'Flat', icon: Building },
  { value: 'room', label: 'Room', icon: Users },
];

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('hostel');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      type
    });

    setName('');
    setDescription('');
    setType('hostel');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Group</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Room 204 Mates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-clean"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-clean resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Type</Label>
            <RadioGroup
              value={type}
              onValueChange={setType}
              className="grid grid-cols-2 gap-3"
            >
              {GROUP_TYPES.map((groupType) => {
                const Icon = groupType.icon;
                return (
                  <div key={groupType.value}>
                    <RadioGroupItem
                      value={groupType.value}
                      id={groupType.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={groupType.value}
                      className="flex items-center gap-3 rounded-xl border-2 border-muted bg-card p-4 cursor-pointer transition-all hover:bg-muted peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{groupType.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
