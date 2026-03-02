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

// localStorage helpers for wallet-based identity
const WALLET_ROLE_KEY = (addr: string) => `chainGrant_role_${addr}`;
const WALLET_NAME_KEY = (addr: string) => `chainGrant_name_${addr}`;

interface AuthContextType {
  user: User | null;
  role: Role;
  displayName: string | null;
  setRole: (role: Role) => void;
  address: string | null;
  connectWallet: () => Promise<void>;
  connectWalletAndLogin: (role: Role, username: string) => Promise<void>;
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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Two-phase loading: wait for BOTH Firebase auth AND Pera reconnect
  const [authReady, setAuthReady] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  const loading = !authReady || !walletReady;

  useEffect(() => {
    // Phase 1: Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setRoleState(userDoc.data().role as Role);
          setDisplayName(userDoc.data().username || firebaseUser.email?.split('@')[0] || null);
        }
      }
      setAuthReady(true);
    });

    // Phase 2: Pera Wallet reconnect (independent of Firebase)
    const reconnectPera = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          const walletAddr = accounts[0];
          setAddress(walletAddr);
          // Restore role and name from localStorage
          const storedRole = localStorage.getItem(WALLET_ROLE_KEY(walletAddr)) as Role | null;
          const storedName = localStorage.getItem(WALLET_NAME_KEY(walletAddr));
          if (storedRole) setRoleState(storedRole);
          if (storedName) setDisplayName(storedName);
        }
      } catch (e) {
        console.log('Pera reconnect failed (normal if not previously connected)', e);
      } finally {
        // Always mark wallet as ready — even if reconnect failed
        setWalletReady(true);
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
      const username = email.split('@')[0];
      await setDoc(doc(db, 'users', res.user.uid), {
        email,
        username,
        role: initialRole,
        createdAt: new Date().toISOString()
      });
      setRoleState(initialRole);
      setDisplayName(username);
    }
  };

  /**
   * Connect Pera Wallet and bind a username to the wallet address.
   * Role + username stored in localStorage — no Firebase Auth needed.
   */
  const connectWalletAndLogin = async (selectedRole: Role, username: string) => {
    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No accounts returned from wallet');

    const walletAddress = accounts[0];
    setAddress(walletAddress);
    setRoleState(selectedRole);
    setDisplayName(username || walletAddress.substring(0, 8));

    // Persist role and username in localStorage keyed by wallet address
    if (selectedRole) localStorage.setItem(WALLET_ROLE_KEY(walletAddress), selectedRole);
    if (username) localStorage.setItem(WALLET_NAME_KEY(walletAddress), username);
  };

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const walletAddr = accounts[0];
        setAddress(walletAddr);
        const storedRole = localStorage.getItem(WALLET_ROLE_KEY(walletAddr)) as Role;
        const storedName = localStorage.getItem(WALLET_NAME_KEY(walletAddr));
        if (storedRole) setRoleState(storedRole);
        if (storedName) setDisplayName(storedName);
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
    if (address && newRole) localStorage.setItem(WALLET_ROLE_KEY(address), newRole);
    setRoleState(newRole);
  };

  const logout = async () => {
    await signOut(auth);
    try { await peraWallet.disconnect(); } catch (e) { /* ignore */ }
    if (address) {
      localStorage.removeItem(WALLET_ROLE_KEY(address));
      localStorage.removeItem(WALLET_NAME_KEY(address));
    }
    setAddress(null);
    setRoleState(null);
    setDisplayName(null);
  };

  return (
    <AuthContext.Provider value={{
      user, role, displayName, setRole, address,
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
