import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type DigestFrequency = 'none' | 'daily' | 'weekly';

export interface EmailPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  digest_frequency: DigestFrequency;
  expense_emails: boolean;
  settlement_emails: boolean;
  member_emails: boolean;
}

const DEFAULT_PREFERENCES: Omit<EmailPreferences, 'id' | 'user_id'> = {
  email_enabled: true,
  digest_frequency: 'none',
  expense_emails: true,
  settlement_emails: true,
  member_emails: true,
};

export function useEmailPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['email-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            ...DEFAULT_PREFERENCES,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as EmailPreferences;
      }

      return data as EmailPreferences;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<EmailPreferences, 'id' | 'user_id'>>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('email_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-preferences', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update preferences',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setEmailEnabled = useCallback((enabled: boolean) => {
    updateMutation.mutate({ email_enabled: enabled });
  }, [updateMutation]);

  const setDigestFrequency = useCallback((frequency: DigestFrequency) => {
    updateMutation.mutate({ digest_frequency: frequency });
  }, [updateMutation]);

  const setExpenseEmails = useCallback((enabled: boolean) => {
    updateMutation.mutate({ expense_emails: enabled });
  }, [updateMutation]);

  const setSettlementEmails = useCallback((enabled: boolean) => {
    updateMutation.mutate({ settlement_emails: enabled });
  }, [updateMutation]);

  const setMemberEmails = useCallback((enabled: boolean) => {
    updateMutation.mutate({ member_emails: enabled });
  }, [updateMutation]);

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    isSaving: updateMutation.isPending,
    setEmailEnabled,
    setDigestFrequency,
    setExpenseEmails,
    setSettlementEmails,
    setMemberEmails,
  };
}
