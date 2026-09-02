import { UserRole, UserRoleData, useUserRoles } from '@/hooks/use-user-roles';
import { checkCurrentSession } from '@/scripts/util';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, ID, Query } from 'react-native-appwrite';
import { client, databases } from '../hooks/appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const apiKey = process.env.EXPO_PUBLIC_APPWRITE_API_KEY || '';

const userDB = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_ID || '';
const userCollection = process.env.EXPO_PUBLIC_DATABASE_USER_PROFILES_USER_FILES || '';
const userPFPStorage = process.env.EXPO_PUBLIC_STORAGE_USER_PFP_BUCKET_ID || '';

interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification?: boolean;
  phone?: string;
  role?: UserRole;
  roles?: UserRole[];
  roleData?: UserRoleData[];
  profilePhoto?: string;
  coverPhoto?: string;
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
  getUserById: (userId: string) => Promise<User | null>;
getUserProfilePhoto: (userId: string) => Promise<string | null>;
  getCurrentUser: () => User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());

  const {
    activeRoles,
    loading: rolesLoading,
    fetchUserRoles,
    getHighestRole: getHighestRoleFn,
    isAtLeastRole: isAtLeastRoleFn,
    refresh,
    createDefaultRole
  } = useUserRoles(user?.$id || '');

  const account = new Account(client);

  const getUserProfilePhoto = async (userId: string): Promise<string | null> => {
  try {
    const response = await databases.listDocuments(
      userDB,
      userCollection,
      [
        Query.equal('user_id', userId),
        Query.equal('file_type', 'profile_photo'),
        Query.limit(1)
      ]
    );

    if (response.documents.length > 0) {
      const fileData = response.documents[0];
      const fileId = fileData.file_id;
      return `${endpoint}/storage/buckets/${userPFPStorage}/files/${fileId}/view?project=${projectId}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile photo:', error);
    return null;
  }
};

  const getUserById = async (userId: string): Promise<User | null> => {
    if (userCache.has(userId)) {
        return userCache.get(userId) || null;
    }

    try {
        const response = await fetch(`${endpoint}/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Response-Format': '1.0.0',
                'X-Appwrite-Key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const userData = await response.json();

        const formattedUser: User = {
            $id: userData.$id,
            email: userData.email || '',
            name: userData.name || 'User',
            emailVerification: userData.emailVerification || false,
            phone: userData.phone || '',
            ...userData
        };

        setUserCache(prev => new Map(prev).set(userId, formattedUser));
        
        return formattedUser;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return {
            $id: userId,
            email: '',
            name: 'Unknown User',
        };
    }
};

  const getCurrentUser = (): User | null => {
    return user;
  };

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const session = await checkCurrentSession();
      
      if (session) {
        const userData = await account.get();
        
        if (userData.$id) {
          try {
            await fetchUserRoles();
            
            const highestRoleData = getHighestRoleFn();
            const highestRole: UserRole | undefined = highestRoleData ? highestRoleData.role as UserRole : undefined;
            
            setUser({
              ...userData,
              roles: activeRoles.map(role => role.role as UserRole),
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
      
      await account.createEmailPasswordSession(emailInput, passwordInput);
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
      
      console.log('Login successful');
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
      
      console.log('Account created:', newUser);
      
      let defaultRole: UserRoleData | null = null;
      try {
        defaultRole = await createDefaultRole(newUser.$id);
        console.log('Default explorer role created:', defaultRole);
      } catch (roleError) {
        console.error('Failed to create default role:', roleError);
      }
      
      await account.createEmailPasswordSession(emailInput, passwordInput);
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
      
      console.log('Registration and login successful');
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
      console.log('Logged out successfully');
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
    return activeRoles.some(role => role.role === roleName && role.is_active);
  };

  const hasAnyRole = (roleNames: UserRole[]): boolean => {
    return roleNames.some(role => hasRole(role));
  };

  const hasAllRoles = (roleNames: UserRole[]): boolean => {
    return roleNames.every(role => hasRole(role));
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
      getUserById,
      getCurrentUser,
      getUserProfilePhoto
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