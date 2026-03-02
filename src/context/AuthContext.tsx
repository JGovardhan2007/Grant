import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'Sponsor' | 'Student' | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('chainGrantRole');
    return (savedRole as Role) || null;
  });

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem('chainGrantRole', newRole);
    } else {
      localStorage.removeItem('chainGrantRole');
    }
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, logout }}>
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
