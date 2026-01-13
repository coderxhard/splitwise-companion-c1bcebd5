import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  invite_code: string;
  invite_code_expires_at: string | null;
  invite_code_single_use: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export function useGroups() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Group[];
    },
    enabled: !!user
  });
}

export function useGroup(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      if (!user || !groupId) return null;

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (error) throw error;
      return data as Group | null;
    },
    enabled: !!user && !!groupId
  });
}

export function useGroupMembers(groupId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!user || !groupId) return [];

      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Fetch profiles for each member
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine members with profiles
      const membersWithProfiles = members.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id)
      }));

      return membersWithProfiles as GroupMember[];
    },
    enabled: !!user && !!groupId
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, type }: { name: string; description?: string; type: string }) => {
      if (!user) throw new Error('Not authenticated');

      // IMPORTANT: don't request the inserted row back (RETURNING) because RLS
      // SELECT policies may block returning the new row before post-insert triggers run.
      const { error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          type,
          created_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: 'Group created',
        description: 'Your new group has been created successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating group',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) throw new Error('Not authenticated');

      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, invite_code_expires_at')
        .eq('invite_code', inviteCode)
        .maybeSingle();

      if (groupError) throw groupError;
      if (!group) throw new Error('Invalid invite code');

      // Check if invite code has expired
      if (group.invite_code_expires_at) {
        const expiresAt = new Date(group.invite_code_expires_at);
        if (expiresAt < new Date()) {
          throw new Error('This invite code has expired. Please ask the group creator for a new code.');
        }
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) throw new Error('You are already a member of this group');

      // Join the group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (joinError) throw joinError;
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast({
        title: 'Joined group',
        description: 'You have successfully joined the group.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error joining group',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('regenerate_invite_code', {
        group_id: groupId
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      toast({
        title: 'Invite code regenerated',
        description: 'A new invite code has been created and will expire in 7 days.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error regenerating code',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
