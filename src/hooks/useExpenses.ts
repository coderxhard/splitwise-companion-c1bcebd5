import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  category: string;
  expense_type: string;
  expense_date: string;
  next_recurrence_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface CreateExpenseData {
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
  category?: string;
  expenseType: 'one-time' | 'monthly';
  expenseDate: string;
  splits: { userId: string; amount: number }[];
}

export function useExpenses(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses', groupId],
    queryFn: async () => {
      if (!user || !groupId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user && !!groupId
  });
}

export function useExpenseSplits(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expense-splits', groupId],
    queryFn: async () => {
      if (!user || !groupId) return [];

      // First get all expense IDs for this group
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('group_id', groupId);

      if (expensesError) throw expensesError;
      if (!expenses || expenses.length === 0) return [];

      const expenseIds = expenses.map(e => e.id);

      const { data, error } = await supabase
        .from('expense_splits')
        .select('*')
        .in('expense_id', expenseIds);

      if (error) throw error;
      return data as ExpenseSplit[];
    },
    enabled: !!user && !!groupId
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      if (!user) throw new Error('Not authenticated');

      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: data.groupId,
          title: data.title,
          amount: data.amount,
          paid_by: data.paidBy,
          category: data.category || 'general',
          expense_type: data.expenseType,
          expense_date: data.expenseDate,
          next_recurrence_date: data.expenseType === 'monthly' 
            ? new Date(new Date(data.expenseDate).setMonth(new Date(data.expenseDate).getMonth() + 1)).toISOString().split('T')[0]
            : null
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Create splits
      const splitsToInsert = data.splits.map(split => ({
        expense_id: expense.id,
        user_id: split.userId,
        amount: split.amount
      }));

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splitsToInsert);

      if (splitsError) throw splitsError;

      return expense;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits', variables.groupId] });
      toast({
        title: 'Expense added',
        description: 'The expense has been recorded successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error adding expense',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId, groupId }: { expenseId: string; groupId: string }) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return { groupId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['expense-splits', data.groupId] });
      toast({
        title: 'Expense deleted',
        description: 'The expense has been removed.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting expense',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
