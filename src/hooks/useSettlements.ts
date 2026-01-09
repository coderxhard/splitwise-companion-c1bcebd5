import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sendPushNotification } from '@/hooks/usePushNotifications';
import { triggerConfetti } from '@/lib/confetti';

export interface Settlement {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  notes: string | null;
  settled_at: string;
  created_at: string;
}

export function useSettlements(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      if (!user || !groupId) return [];

      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .order('settled_at', { ascending: false });

      if (error) throw error;
      return data as Settlement[];
    },
    enabled: !!user && !!groupId
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      groupId,
      toUserId,
      amount,
      notes
    }: {
      groupId: string;
      toUserId: string;
      amount: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('settlements')
        .insert({
          group_id: groupId,
          from_user_id: user.id,
          to_user_id: toUserId,
          amount,
          notes: notes || null
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', variables.groupId] });
      
      // Trigger celebration confetti!
      triggerConfetti();
      
      toast({
        title: '🎉 Settlement recorded!',
        description: 'The payment has been recorded successfully.'
      });
      
      // Send push notification to the recipient
      sendPushNotification({
        groupId: variables.groupId,
        type: 'settlement',
        title: 'Payment Received',
        body: `You received a payment of $${variables.amount.toFixed(2)}`,
        actorUserId: user?.id || ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error recording settlement',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settlementId, groupId }: { settlementId: string; groupId: string }) => {
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('id', settlementId);

      if (error) throw error;
      return { groupId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', data.groupId] });
      toast({
        title: 'Settlement deleted',
        description: 'The settlement record has been removed.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting settlement',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
