import { client } from '@/hooks/appwrite';
import { checkCurrentSession } from '@/scripts/util';
import { Account, ID } from 'appwrite';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification?: boolean;
  phone?: string;
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const account = new Account(client);

  const checkSession = async () => {
    try {
      setIsLoading(true);
      const session = await checkCurrentSession();
      
      if (session) {
        const userData = await account.get();
        setUser(userData);
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
      
      setUser(userData);
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
      
      const session = await account.createEmailPasswordSession(emailInput, passwordInput);
      const userData = await account.get();
      
      setUser(userData);
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

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      isLoggedIn,
      isLoading,
      email,
      setEmail,
      password,
      setPassword,
      login,
      logout,
      register,
      checkSession,
      clearCredentials
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