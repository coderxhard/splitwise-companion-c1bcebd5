import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Receipt, Handshake, Users, Loader2, Calendar } from 'lucide-react';
import { useEmailPreferences, DigestFrequency } from '@/hooks/useEmailPreferences';

export const EmailPreferences: React.FC = () => {
  const {
    preferences,
    isLoading,
    isSaving,
    setEmailEnabled,
    setDigestFrequency,
    setExpenseEmails,
    setSettlementEmails,
    setMemberEmails,
  } = useEmailPreferences();

  if (isLoading) {
    return (
      <Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="opacity-0 animate-fade-in-up overflow-hidden" style={{ animationDelay: '0.15s' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 icon-float">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          Email Notifications
        </CardTitle>
        <CardDescription>Configure email notifications and digest summaries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master email toggle */}
        <div className="preference-row opacity-0 animate-slide-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="email-toggle" className="font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
          </div>
          <Switch
            id="email-toggle"
            checked={preferences?.email_enabled ?? true}
            onCheckedChange={setEmailEnabled}
            disabled={isSaving}
          />
        </div>

        {preferences?.email_enabled && (
          <div className="space-y-4 animate-fade-in">
            {/* Digest frequency */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in stagger-2">
                <div className="p-2 rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium">Digest Frequency</h4>
              </div>
              <RadioGroup
                value={preferences?.digest_frequency ?? 'none'}
                onValueChange={(value) => setDigestFrequency(value as DigestFrequency)}
                className="space-y-2 ml-1"
                disabled={isSaving}
              >
                <div className="flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-muted/50 opacity-0 animate-slide-up stagger-2">
                  <RadioGroupItem value="none" id="digest-none" />
                  <Label htmlFor="digest-none" className="font-normal cursor-pointer flex-1">
                    <span className="font-medium">Instant</span>
                    <span className="text-muted-foreground ml-2">— Get notified immediately</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-muted/50 opacity-0 animate-slide-up stagger-3">
                  <RadioGroupItem value="daily" id="digest-daily" />
                  <Label htmlFor="digest-daily" className="font-normal cursor-pointer flex-1">
                    <span className="font-medium">Daily digest</span>
                    <span className="text-muted-foreground ml-2">— Summary once per day</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-muted/50 opacity-0 animate-slide-up stagger-4">
                  <RadioGroupItem value="weekly" id="digest-weekly" />
                  <Label htmlFor="digest-weekly" className="font-normal cursor-pointer flex-1">
                    <span className="font-medium">Weekly digest</span>
                    <span className="text-muted-foreground ml-2">— Summary once per week</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Email type toggles */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-4 opacity-0 animate-fade-in stagger-4">Email Types</h4>
              <div className="space-y-2">
                {/* Expense emails */}
                <div className="preference-row opacity-0 animate-slide-up stagger-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="expense-email-toggle" className="font-medium">
                        Expense Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        New expenses and changes
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="expense-email-toggle"
                    checked={preferences?.expense_emails ?? true}
                    onCheckedChange={setExpenseEmails}
                    disabled={isSaving}
                  />
                </div>

                {/* Settlement emails */}
                <div className="preference-row opacity-0 animate-slide-up stagger-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="settlement-email-toggle" className="font-medium">
                        Settlement Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Payments and settlements
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="settlement-email-toggle"
                    checked={preferences?.settlement_emails ?? true}
                    onCheckedChange={setSettlementEmails}
                    disabled={isSaving}
                  />
                </div>

                {/* Member emails */}
                <div className="preference-row opacity-0 animate-slide-up stagger-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="member-email-toggle" className="font-medium">
                        Member Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When members join or leave
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="member-email-toggle"
                    checked={preferences?.member_emails ?? true}
                    onCheckedChange={setMemberEmails}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
