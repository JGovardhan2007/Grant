import React, { createContext, useContext, useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

const peraWallet = new PeraWalletConnect();

type Role = 'Sponsor' | 'Student' | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  address: string | null;
  connectWallet: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('chainGrantRole');
    return (savedRole as Role) || null;
  });
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Reconnect to Pera Wallet session on mount
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    });

    // Pera Wallet usually doesn't need an 'on' listener for disconnect if we handle it in logout
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('chainGrantRole', newRole);
    } else {
      localStorage.removeItem('chainGrantRole');
    }
  };

  const logout = () => {
    peraWallet.disconnect();
    setRole(null);
    setAddress(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, address, connectWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
