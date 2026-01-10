import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinGroup } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';

const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const joinGroup = useJoinGroup();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (user && code && !hasAttempted && !joinGroup.isPending) {
      setHasAttempted(true);
      joinGroup.mutate(code, {
        onSuccess: () => {
          navigate('/groups');
        },
        onError: () => {
          // Error is handled by the hook
        }
      });
    }
  }, [user, code, hasAttempted, joinGroup, navigate]);

  if (authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    // Store the invite code and redirect to auth
    sessionStorage.setItem('pendingInviteCode', code || '');
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="font-display text-xl">
              {joinGroup.isPending ? 'Joining Group...' : 
               joinGroup.isSuccess ? 'Joined Successfully!' :
               joinGroup.isError ? 'Unable to Join' : 'Joining Group'}
            </CardTitle>
            <CardDescription>
              {joinGroup.isPending ? 'Please wait while we add you to the group' :
               joinGroup.isSuccess ? 'You have been added to the group' :
               joinGroup.isError ? 'There was a problem joining this group' : 
               `Invite code: ${code}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(joinGroup.isError || joinGroup.isSuccess) && (
              <Button 
                className="w-full" 
                onClick={() => navigate('/groups')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Groups
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default JoinGroupPage;
