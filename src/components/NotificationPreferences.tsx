import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, Receipt, Handshake, Users } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export const NotificationPreferences: React.FC = () => {
  const { preferences, setSoundEnabled, setTypeEnabled } = useNotificationPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="sound-toggle" className="font-medium">
                Notification Sound
              </Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when new notifications arrive
              </p>
            </div>
          </div>
          <Switch
            id="sound-toggle"
            checked={preferences.soundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-4">Notification Types</h4>
          <div className="space-y-4">
            {/* Expense notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="expense-toggle" className="font-medium">
                    Expense Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New expenses and changes
                  </p>
                </div>
              </div>
              <Switch
                id="expense-toggle"
                checked={preferences.types.expense}
                onCheckedChange={(checked) => setTypeEnabled('expense', checked)}
              />
            </div>

            {/* Settlement notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="settlement-toggle" className="font-medium">
                    Settlement Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Payments and settlements
                  </p>
                </div>
              </div>
              <Switch
                id="settlement-toggle"
                checked={preferences.types.settlement}
                onCheckedChange={(checked) => setTypeEnabled('settlement', checked)}
              />
            </div>

            {/* Member notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="member-toggle" className="font-medium">
                    Member Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When members join or leave
                  </p>
                </div>
              </div>
              <Switch
                id="member-toggle"
                checked={preferences.types.member}
                onCheckedChange={(checked) => setTypeEnabled('member', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
