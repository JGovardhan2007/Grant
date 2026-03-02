import React, { createContext, useContext, useState, useEffect } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const peraWallet = new PeraWalletConnect();

type Role = 'Sponsor' | 'Student' | null;

// localStorage keys (cache layer - Firestore is the source of truth)
const LS = {
  role: (addr: string) => `cg_role_${addr}`,
  email: (addr: string) => `cg_email_${addr}`,
};

interface AuthContextType {
  user: User | null;
  role: Role;
  email: string | null;
  displayName: string | null;
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
    // Firebase auth listener (kept for compatibility)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    // Reconnect any existing Pera Wallet session on app load
    const reconnectPera = async () => {
      const hasStoredSession = Object.keys(localStorage).some(k => k.startsWith('cg_role_'));
      if (!hasStoredSession) {
        setWalletReady(true);
        return;
      }

      const safetyTimer = setTimeout(() => setWalletReady(true), 5000);
      try {
        const accounts = await peraWallet.reconnectSession();
        clearTimeout(safetyTimer);
        if (accounts.length > 0) {
          const addr = accounts[0];
          setAddress(addr);
          // Read from localStorage cache first (fast), then Firestore (authoritative)
          const cachedRole = localStorage.getItem(LS.role(addr)) as Role | null;
          const cachedEmail = localStorage.getItem(LS.email(addr));
          if (cachedRole) setRoleState(cachedRole);
          if (cachedEmail) setEmail(cachedEmail);

          // Background-sync from Firestore to keep cache fresh
          getDoc(doc(db, 'walletUsers', addr)).then(snap => {
            if (snap.exists()) {
              const d = snap.data();
              setRoleState(d.role as Role);
              setEmail(d.email);
              localStorage.setItem(LS.role(addr), d.role);
              localStorage.setItem(LS.email(addr), d.email);
            }
          }).catch(() => {/* offline — use cache */ });
        }
      } catch (e) {
        clearTimeout(safetyTimer);
      } finally {
        setWalletReady(true);
      }
    };

    reconnectPera();
    return () => unsubscribe();
  }, []);

  /**
   * SIGN UP: collects email + role, opens Pera Wallet, gets wallet address,
   * then stores the binding in BOTH Firestore and localStorage.
   */
  const signupWithWallet = async (userEmail: string, selectedRole: Role) => {
    // Disconnect any existing session so user always gets to pick/confirm their wallet
    try { await peraWallet.disconnect(); } catch (e) { /* ignore if no session */ }

    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No wallet accounts found');

    const addr = accounts[0];

    // 1. Write to Firestore — this is the source of truth
    await setDoc(doc(db, 'walletUsers', addr), {
      email: userEmail,
      role: selectedRole,
      walletAddress: addr,
      createdAt: new Date().toISOString(),
    });

    // 2. Cache locally for fast reconnect
    localStorage.setItem(LS.role(addr), selectedRole || '');
    localStorage.setItem(LS.email(addr), userEmail);

    setAddress(addr);
    setRoleState(selectedRole);
    setEmail(userEmail);
  };

  /**
   * LOGIN: opens Pera Wallet, reads email + role from Firestore using the wallet address.
   * No email input needed — the wallet IS the identity.
   */
  const loginWithWallet = async () => {
    // Always disconnect first to clear any stale session.
    // This ensures the account Pera connects with === the address we store in state.
    try { await peraWallet.disconnect(); } catch (e) { /* ignore if no session */ }

    const accounts = await peraWallet.connect();
    if (accounts.length === 0) throw new Error('No wallet accounts found');

    const addr = accounts[0];

    // Look up wallet address in Firestore
    const snap = await getDoc(doc(db, 'walletUsers', addr));

    if (!snap.exists()) {
      // Not registered — prompt to sign up
      throw new Error('WALLET_NOT_REGISTERED');
    }

    const data = snap.data();
    const storedRole = data.role as Role;
    const storedEmail = data.email as string;

    // Cache locally for fast reconnect next time
    localStorage.setItem(LS.role(addr), storedRole || '');
    localStorage.setItem(LS.email(addr), storedEmail);

    setAddress(addr);
    setRoleState(storedRole);
    setEmail(storedEmail);
  };

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const addr = accounts[0];
        setAddress(addr);
        const storedRole = localStorage.getItem(LS.role(addr)) as Role | null;
        const storedEmail = localStorage.getItem(LS.email(addr));
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
      localStorage.removeItem(LS.role(address));
      localStorage.removeItem(LS.email(address));
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
