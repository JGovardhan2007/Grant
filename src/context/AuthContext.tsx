import React, { createContext, useContext, useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const peraWallet = new PeraWalletConnect();

type Role = 'Sponsor' | 'Student' | null;

// localStorage helpers for wallet-based identity (no Firebase Auth needed)
const WALLET_ROLE_KEY = (addr: string) => `chainGrant_role_${addr}`;

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  address: string | null;
  connectWallet: () => Promise<void>;
  connectWalletAndLogin: (role: Role) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransaction: (txns: any[]) => Promise<Uint8Array[]>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, role: Role) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setRoleState(userDoc.data().role as Role);
        }
      } else {
        // If no Firebase user, role will be restored from wallet reconnect below
      }
      setLoading(false);
    });

    // Reconnect to Pera Wallet session on mount
    const reconnectPera = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          const walletAddr = accounts[0];
          setAddress(walletAddr);
          // Restore role from localStorage (wallet-based login)
          const storedRole = localStorage.getItem(WALLET_ROLE_KEY(walletAddr)) as Role | null;
          if (storedRole) {
            setRoleState(storedRole);
            setLoading(false); // Role is restored, no longer loading
          }
        }
      } catch (e) {
        console.log('Pera reconnect failed', e);
      }
    };

    reconnectPera();
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, initialRole: Role) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await setDoc(doc(db, 'users', res.user.uid), {
        email,
        role: initialRole,
        createdAt: new Date().toISOString()
      });
      setRoleState(initialRole);
    }
  };

  /**
   * Connect Pera Wallet and use wallet address as primary identity.
   * Role is stored in localStorage — no Firebase Anonymous Auth needed.
   */
  const connectWalletAndLogin = async (selectedRole: Role) => {
    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No accounts returned from wallet');

    const walletAddress = accounts[0];
    setAddress(walletAddress);
    setRoleState(selectedRole);

    // Persist role in localStorage keyed by wallet address
    if (selectedRole) {
      localStorage.setItem(WALLET_ROLE_KEY(walletAddress), selectedRole);
    }
  };

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        // Restore role from localStorage if previously logged in via wallet
        const storedRole = localStorage.getItem(WALLET_ROLE_KEY(accounts[0])) as Role;
        if (storedRole) setRoleState(storedRole);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  /**
   * Disconnect Pera Wallet — clears address so users can switch wallets.
   */
  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
    } catch (e) { /* ignore */ }
    setAddress(null);
    // Keep role so email-based users aren't affected
  };

  const signTransaction = async (txns: any[]) => {
    if (!address) throw new Error('Wallet not connected');
    const signerTransactions = txns.map(txn => ({
      txn,
      signers: [address]
    }));
    return await peraWallet.signTransaction([signerTransactions]);
  };

  const setRole = async (newRole: Role) => {
    if (user && newRole) {
      await setDoc(doc(db, 'users', user.uid), { role: newRole }, { merge: true });
    }
    // Also persist in localStorage if wallet-based
    if (address && newRole) {
      localStorage.setItem(WALLET_ROLE_KEY(address), newRole);
    }
    setRoleState(newRole);
  };

  const logout = async () => {
    await signOut(auth);
    try { await peraWallet.disconnect(); } catch (e) { /* ignore */ }
    if (address) localStorage.removeItem(WALLET_ROLE_KEY(address));
    setAddress(null);
    setRoleState(null);
  };

  return (
    <AuthContext.Provider value={{
      user, role, setRole, address,
      connectWallet, connectWalletAndLogin, disconnectWallet,
      signTransaction, login, signup, logout, loading
    }}>
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
