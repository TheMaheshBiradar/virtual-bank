import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../constants';
import { useMetadata } from './MetadataContext';

interface AuthContextType {
  user: User;
  setUser: (user: User) => void;
  can: (action: PermissionAction, target?: any) => boolean;
}

export type PermissionAction = 
  | 'CREATE_OPPORTUNITY'
  | 'EDIT_OPPORTUNITY'
  | 'DELETE_OPPORTUNITY'
  | 'BULK_ACTION'
  | 'VIEW_INSIGHTS'
  | 'MANAGE_USERS';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { users, isLoading } = useMetadata();
  // Default fallback user until metadata loads
  const [user, setUser] = useState<User>({
    id: 'loading',
    name: 'Loading...',
    alias: '??',
    role: 'SALES_REP',
    color: 'bg-zinc-200',
    email: 'loading@example.com'
  });

  useEffect(() => {
    if (!isLoading && users.length > 0 && user.id === 'loading') {
      setUser(users[0]);
    }
  }, [isLoading, users, user.id]);

  const can = (action: PermissionAction, target?: any): boolean => {
    switch (action) {
      case 'CREATE_OPPORTUNITY':
        return true; // Everyone can create
      
      case 'EDIT_OPPORTUNITY':
        if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
        // Sales Reps can only edit their own
        return target?.ownerAlias === user.alias;
      
      case 'DELETE_OPPORTUNITY':
        // Only Admins can delete anything, Managers can delete their own
        if (user.role === 'ADMIN') return true;
        if (user.role === 'MANAGER') return target?.ownerAlias === user.alias;
        return false;
      
      case 'BULK_ACTION':
        return user.role === 'ADMIN' || user.role === 'MANAGER';
      
      case 'VIEW_INSIGHTS':
        return user.role === 'ADMIN' || user.role === 'MANAGER';
      
      case 'MANAGE_USERS':
        return user.role === 'ADMIN';
      
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, can }}>
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
