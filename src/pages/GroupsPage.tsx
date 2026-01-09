import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { GroupCard } from '@/components/GroupCard';
import { CreateGroupDialog } from '@/components/CreateGroupDialog';
import { JoinGroupDialog } from '@/components/JoinGroupDialog';
import { useGroups, useCreateGroup, useJoinGroup } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Users } from 'lucide-react';

const GroupsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCreateGroup = (data: { name: string; description?: string; type: string }) => {
    createGroup.mutate(data, {
      onSuccess: () => setCreateDialogOpen(false)
    });
  };

  const handleJoinGroup = (inviteCode: string) => {
    joinGroup.mutate(inviteCode, {
      onSuccess: () => setJoinDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 opacity-0 animate-fade-in-down">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Your Groups</h1>
            <p className="text-muted-foreground mt-1">Manage expenses with your roommates</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setJoinDialogOpen(true)}
              className="flex-1 sm:flex-none transition-all duration-200 hover:scale-105"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Join Group
            </Button>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="flex-1 sm:flex-none transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>

        {/* Groups List */}
        {groupsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <GroupCard key={group.id} group={group} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6 opacity-0 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create a new group for your hostel, PG, or flat to start tracking shared expenses.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setJoinDialogOpen(true)} className="transition-all duration-200 hover:scale-105">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Group
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateGroup}
        isLoading={createGroup.isPending}
      />

      <JoinGroupDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onSubmit={handleJoinGroup}
        isLoading={joinGroup.isPending}
      />
    </Layout>
  );
};

export default GroupsPage;
