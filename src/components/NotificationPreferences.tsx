import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, Receipt, Handshake, Users, Smartphone, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPreferences: React.FC = () => {
  const { preferences, setSoundEnabled, setTypeEnabled } = useNotificationPreferences();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <Card className="opacity-0 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.1s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 icon-float">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          Notifications
        </CardTitle>
        <CardDescription>Configure how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Push notifications toggle */}
        {isSupported && (
          <div className="preference-row opacity-0 animate-slide-up stagger-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="push-toggle" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications even when the app is closed
                </p>
              </div>
            </div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="push-toggle"
                checked={isSubscribed}
                onCheckedChange={handlePushToggle}
              />
            )}
          </div>
        )}

        {/* Sound toggle */}
        <div className="preference-row opacity-0 animate-slide-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
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

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-4 opacity-0 animate-fade-in stagger-3">Notification Types</h4>
          <div className="space-y-2">
            {/* Expense notifications */}
            <div className="preference-row opacity-0 animate-slide-up stagger-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </div>
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
            <div className="preference-row opacity-0 animate-slide-up stagger-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                </div>
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
            <div className="preference-row opacity-0 animate-slide-up stagger-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
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
