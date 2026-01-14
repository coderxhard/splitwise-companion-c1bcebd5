import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, QrCode } from 'lucide-react';
import { QRScanner } from './QRScanner';

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (inviteCode: string) => void;
  isLoading: boolean;
}

export const JoinGroupDialog: React.FC<JoinGroupDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    onSubmit(inviteCode.trim());
    setInviteCode('');
  };

  const handleScan = (code: string) => {
    setShowScanner(false);
    setInviteCode(code);
    onSubmit(code);
  };

  if (showScanner) {
    return <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Join a Group
          </DialogTitle>
          <DialogDescription>
            Enter the invite code or scan a QR code to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="input-clean font-mono text-center text-lg tracking-widest"
              maxLength={20}
            />
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => setShowScanner(true)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !inviteCode.trim()}>
              {isLoading ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
