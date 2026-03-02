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

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  address: string | null;
  connectWallet: () => Promise<void>;
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
        // Fetch role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setRoleState(userDoc.data().role as Role);
        }
      } else {
        setRoleState(null);
      }
      setLoading(false);
    });

    // Reconnect to Pera Wallet session on mount
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    });

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
    setRoleState(newRole);
  };

  const logout = async () => {
    await signOut(auth);
    peraWallet.disconnect();
    setAddress(null);
    setRoleState(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, address, connectWallet, signTransaction, login, signup, logout, loading }}>
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
