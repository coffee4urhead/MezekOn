import { client } from '@/hooks/appwrite';
import { UserRole, UserRoleData, useUserRoles } from '@/hooks/use-user-roles';
import { checkCurrentSession } from '@/scripts/util';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, ID } from 'react-native-appwrite';

interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification?: boolean;
  phone?: string;
  role?: UserRole;
  roles?: UserRole[]; 
  roleData?: UserRoleData[];
  [key: string]: any;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  checkSession: () => Promise<void>;
  clearCredentials: () => void;
  hasRole: (role: UserRole, checkActive?: boolean) => boolean;
  hasAnyRole: (roles: UserRole[], checkActive?: boolean) => boolean;
  hasAllRoles: (roles: UserRole[], checkActive?: boolean) => boolean;
  getHighestRole: () => UserRoleData | null;
  isAtLeastRole: (minRole: UserRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {
    roles,
    activeRoles,
    loading: rolesLoading,
    error: rolesError,
    isUpdating,
    fetchUserRoles,
    assignRole,
    revokeRole,
    deactivateRole,
    activateRole,
    hasRole: hasRoleFn,
    hasAnyRole: hasAnyRoleFn,
    hasAllRoles: hasAllRolesFn,
    getRolesByRegion,
    getHighestRole: getHighestRoleFn,
    getRolePermissions,
    getRoleHierarchyLevel,
    isAtLeastRole: isAtLeastRoleFn,
    canPerformAction,
    resetError,
    refresh,
    createDefaultRole
  } = useUserRoles(user?.$id || '');

  const account = new Account(client);

  const checkSession = async () => {
  try {
    setIsLoading(true);
    const session = await checkCurrentSession();
    
    if (session) {
      const userData = await account.get();
      
      if (userData.$id) {
        try {
          await fetchUserRoles();
          
          const roleNames: UserRole[] = activeRoles.map(role => role.role as UserRole);
          const highestRoleData = getHighestRoleFn();
          const highestRole: UserRole | undefined = highestRoleData ? highestRoleData.role as UserRole : undefined;
          
          console.log('User with id' + user?.$id + 'has these roles' + activeRoles.join(', ').toString());
          setUser({
            ...userData,
            roles: roleNames,
            role: highestRole,
            roleData: activeRoles,
          });
        } catch (roleError) {
          console.error('Failed to fetch roles:', roleError);
          setUser({
            ...userData,
            roles: [],
            role: undefined,
            roleData: [],
          });
        }
      } else {
        setUser(userData);
      }
      
      setIsLoggedIn(true);
      setEmail(userData.email);
    } else {
      setUser(null);
      setIsLoggedIn(false);
    }
  } catch (error) {
    console.error('Session check failed:', error);
    setUser(null);
    setIsLoggedIn(false);
  } finally {
    setIsLoading(false);
  }
};

  const login = async (emailInput: string, passwordInput: string) => {
  try {
    setIsLoading(true);
    
    try {
      await account.deleteSession('current');
    } catch (e) {
    }
    
    const session = await account.createEmailPasswordSession(emailInput, passwordInput);
    const userData = await account.get();
    
    let roleNames: UserRole[] = []; 
    let highestRole: UserRole | undefined = undefined; 
    
    if (userData.$id) {
      try {
        await fetchUserRoles();
        roleNames = activeRoles.map(role => role.role as UserRole);
        const highestRoleData = getHighestRoleFn();
        highestRole = highestRoleData ? highestRoleData.role as UserRole : undefined;
      } catch (roleError) {
        console.error('Failed to fetch roles during login:', roleError);
      }
    }
    
    setUser({
      ...userData,
      roles: roleNames,
      role: highestRole,
      roleData: activeRoles,
    });
    
    setIsLoggedIn(true);
    setEmail(emailInput);
    setPassword(passwordInput);
    
    console.log('✅ Login successful:', session);
  } catch (error: any) {
    console.error('Login failed:', error.message);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  const register = async (emailInput: string, passwordInput: string) => {
    try {
      setIsLoading(true);
      
      try {
        await account.deleteSession('current');
      } catch (e) {
      }
      
      const newUser = await account.create(
        ID.unique(),
        emailInput,
        passwordInput,
        emailInput.split('@')[0]
      );
      
      console.log('✅ Account created:', newUser);
    
    let defaultRole: UserRoleData | null = null;
    try {
      defaultRole = await createDefaultRole(newUser.$id);
      console.log('✅ Default explorer role created:', defaultRole);
    } catch (roleError) {
      console.error('Failed to create default role:', roleError);
    }
    
    const session = await account.createEmailPasswordSession(emailInput, passwordInput);
    const userData = await account.get();
    
    setUser({
      ...userData,
      roles: defaultRole ? [defaultRole.role] : [],
      role: defaultRole ? 'explorer' : undefined,
      roleData: defaultRole ? [defaultRole] : [],
    });
    
    setIsLoggedIn(true);
    setEmail(emailInput);
    setPassword(passwordInput);
      
      console.log('✅ Login successful after registration:', session);
    } catch (error: any) {
      console.error('Registration failed:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await account.deleteSession('current');
      setUser(null);
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      console.log('✅ Logged out successfully');
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCredentials = () => {
    setEmail('');
    setPassword('');
  };

  const hasRole = (roleName: UserRole): boolean => {
    return hasRoleFn(roleName);
  };

  const hasAnyRole = (roleNames: UserRole[]): boolean => {
    return hasAnyRoleFn(roleNames);
  };

  const hasAllRoles = (roleNames: UserRole[]): boolean => {
    return hasAllRolesFn(roleNames);
  };

  const getHighestRole = (): UserRoleData | null => {
    return getHighestRoleFn();
  };

  const isAtLeastRole = (roleName: UserRole): boolean => {
    return isAtLeastRoleFn(roleName);
  };

  const refreshRoles = async (): Promise<void> => {
    await refresh();
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn,
      isLoading: isLoading || rolesLoading,
      email,
      setEmail,
      password,
      setPassword,
      login,
      logout,
      register,
      checkSession,
      clearCredentials,
      hasRole,
      hasAnyRole,
      hasAllRoles,
      getHighestRole,
      isAtLeastRole,
      refreshRoles,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}