import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import GroupsPage from '@/pages/GroupsPage';
import GroupDashboard from '@/pages/GroupDashboard';
import JoinGroupPage from '@/pages/JoinGroupPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFound from '@/pages/NotFound';

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDashboard />} />
        <Route path="/join/:code" element={<JoinGroupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};
