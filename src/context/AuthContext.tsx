import React, { createContext, useContext, useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

const peraWallet = new PeraWalletConnect();

type Role = 'Sponsor' | 'Student' | null;

// All wallet identity stored in localStorage keyed by wallet address
const key = {
  role: (addr: string) => `cg_role_${addr}`,
  email: (addr: string) => `cg_email_${addr}`,
};

interface AuthContextType {
  user: User | null;            // Firebase user (legacy email login, kept for compat)
  role: Role;
  email: string | null;         // Email bound to the wallet at signup
  displayName: string | null;   // Email prefix shown in navbar
  address: string | null;
  signupWithWallet: (email: string, role: Role) => Promise<void>;
  loginWithWallet: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (txns: any[]) => Promise<Uint8Array[]>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const [authReady, setAuthReady] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  const loading = !authReady || !walletReady;

  const displayName = email ? email.split('@')[0] : (address ? address.substring(0, 8) : null);

  useEffect(() => {
    // Firebase auth listener (for legacy compat — not used in new wallet flow)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    // Pera Wallet reconnect on app start
    const reconnectPera = async () => {
      const hasStoredSession = Object.keys(localStorage).some(k => k.startsWith('cg_role_'));
      if (!hasStoredSession) {
        setWalletReady(true);
        return;
      }

      // Safety timeout: never block the UI for more than 5 seconds
      const safetyTimer = setTimeout(() => setWalletReady(true), 5000);
      try {
        const accounts = await peraWallet.reconnectSession();
        clearTimeout(safetyTimer);
        if (accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          const storedRole = localStorage.getItem(key.role(addr)) as Role | null;
          const storedEmail = localStorage.getItem(key.email(addr));
          if (storedRole) setRoleState(storedRole);
          if (storedEmail) setEmail(storedEmail);
        }
      } catch (e) {
        clearTimeout(safetyTimer);
        console.log('Pera reconnect skipped', e);
      } finally {
        setWalletReady(true);
      }
    };

    reconnectPera();
    return () => unsubscribe();
  }, []);

  /**
   * SIGNUP: collect email + role, then open Pera Wallet.
   * Binds the email and role to the wallet address in localStorage.
   */
  const signupWithWallet = async (userEmail: string, selectedRole: Role) => {
    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No wallet accounts found');

    const addr = accounts[0];
    setAddress(addr);
    setRoleState(selectedRole);
    setEmail(userEmail);

    localStorage.setItem(key.role(addr), selectedRole || '');
    localStorage.setItem(key.email(addr), userEmail);
  };

  /**
   * LOGIN: open Pera Wallet, read stored email + role for that address.
   * No email input needed — the wallet IS the identity.
   */
  const loginWithWallet = async () => {
    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No wallet accounts found');

    const addr = accounts[0];
    const storedRole = localStorage.getItem(key.role(addr)) as Role | null;
    const storedEmail = localStorage.getItem(key.email(addr));

    if (!storedRole) {
      // Wallet not registered — ask to sign up
      throw new Error('WALLET_NOT_REGISTERED');
    }

    setAddress(addr);
    setRoleState(storedRole);
    if (storedEmail) setEmail(storedEmail);
  };

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const addr = accounts[0];
        setAddress(addr);
        const storedRole = localStorage.getItem(key.role(addr)) as Role | null;
        const storedEmail = localStorage.getItem(key.email(addr));
        if (storedRole) setRoleState(storedRole);
        if (storedEmail) setEmail(storedEmail);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = async () => {
    try { await peraWallet.disconnect(); } catch (e) { /* ignore */ }
    setAddress(null);
  };

  const signTransaction = async (txns: any[]) => {
    if (!address) throw new Error('Wallet not connected');
    const signerTxns = txns.map(txn => ({ txn, signers: [address] }));
    return await peraWallet.signTransaction([signerTxns]);
  };

  const logout = async () => {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    try { await peraWallet.disconnect(); } catch (e) { /* ignore */ }
    if (address) {
      localStorage.removeItem(key.role(address));
      localStorage.removeItem(key.email(address));
    }
    setAddress(null);
    setRoleState(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider value={{
      user, role, email, displayName, address,
      signupWithWallet, loginWithWallet,
      connectWallet, disconnectWallet,
      signTransaction, logout, loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
