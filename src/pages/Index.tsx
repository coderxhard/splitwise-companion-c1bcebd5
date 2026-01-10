import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary animate-pulse">
              <span className="text-3xl font-bold text-primary-foreground">₹</span>
            </div>
            <p className="text-muted-foreground animate-pulse">Loading SplitMate...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Redirect based on auth status
  if (user) {
    return <Navigate to="/groups" replace />;
  }

  return <Navigate to="/auth" replace />;
};

export default Index;
