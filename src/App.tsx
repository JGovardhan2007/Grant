import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateGrant from './pages/CreateGrant';
import MilestoneTracker from './pages/MilestoneTracker';
import ProofOfSpend from './pages/ProofOfSpend';
import TransparencyWall from './pages/TransparencyWall';
import NFTBadges from './pages/NFTBadges';

const LoadingScreen = () => (
  <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
    <div className="animate-spin w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full mb-4"></div>
    <p className="text-blue-900 font-bold animate-pulse">Initializing ChainGrant...</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user && !role) {
    // Role still fetching from Firestore
    return <LoadingScreen />;
  }
  return <>{children}</>;
};

const SponsorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (role !== 'Sponsor') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {user && <Navbar />}
      <div className="flex">
        {user && <Sidebar />}
        <main className={`flex-1 p-6 md:p-10 ${user ? 'mt-16 md:ml-64' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginRedirect><Login /></LoginRedirect>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-grant" element={<ProtectedRoute><SponsorRoute><CreateGrant /></SponsorRoute></ProtectedRoute>} />
            <Route path="/grants/:id" element={<ProtectedRoute><MilestoneTracker /></ProtectedRoute>} />
            <Route path="/grants/:id/spend" element={<ProtectedRoute><ProofOfSpend /></ProtectedRoute>} />
            <Route path="/transparency" element={<ProtectedRoute><TransparencyWall /></ProtectedRoute>} />
            <Route path="/nft-badges" element={<ProtectedRoute><NFTBadges /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

const LoginRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
