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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (!role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const SponsorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  if (role !== 'Sponsor') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <div className="flex">
        {role && <Sidebar />}
        <main className={`flex-1 p-6 md:p-10 mt-16 ${role ? 'md:ml-64' : ''}`}>
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
            <Route path="/" element={<Login />} />
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
