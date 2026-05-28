import ThemeToggleButton from '@/components/CustomHeader';
import { useTheme } from '@/context/ThemeContext';
import { client } from '@/hooks/appwrite';
import { Account, ID } from 'appwrite';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const { isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  const PlaceholderImage = require('@/assets/icons/logo.png');

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const account = new Account(client);
      const user = await account.get();
      console.log('Already logged in:', user);
      setIsLoggedIn(true);
      Alert.alert('Info', `Already logged in as: ${user.email || user.$id}`);
    } catch (error: any) {
      console.log('Not logged in');
      setIsLoggedIn(false);
    }
  };

  const logout = async () => {
    try {
      const account = new Account(client);
      await account.deleteSession('current');
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Logged out successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const createAccountAndLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      const account = new Account(client);
      
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore if no session exists
      }
      
      const user = await account.create(
        ID.unique(),
        email,
        password,
        email.split('@')[0]
      );
      console.log('✅ Account created:', user);
      
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful:', session);
      
      setIsLoggedIn(true);
      Alert.alert('Success', 'Account created and logged in!');
    } catch (error: any) {
      console.log('Error:', error.message);
      
      if (error.message.includes('already exists')) {
        Alert.alert('Info', 'User already exists, trying to login...');
        await loginOnly();
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const loginOnly = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const account = new Account(client);
      
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore
      }
      
      const session = await account.createEmailPasswordSession(email, password);
      console.log('✅ Login successful:', session);
      setIsLoggedIn(true);
      Alert.alert('Success', 'Logged in successfully!');
    } catch (error: any) {
      console.log('Login failed:', error.message);
      Alert.alert('Error', `Login failed: ${error.message}`);
    }
  };

  if (isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <View style={styles.loggedInContainer}>
          <Text style={[styles.welcomeText, { color: isDark ? '#ffffff' : '#000000' }]}>
            Добре дошли!
          </Text>
          <Text style={[styles.emailText, { color: isDark ? '#888888' : '#666666' }]}>
            {email}
          </Text>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Изход</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      <ThemeToggleButton />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={PlaceholderImage}
            style={styles.logo}
          />
          <View>
            <Text style={[styles.appTitle, { color: '#0347F2' }]}>MezekON</Text>
            <Text style={[styles.appSubtitle, { color: isDark ? '#888888' : '#666666' }]}>
              Речник на диалектни думи
            </Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            {showLogin ? 'Вход в профила' : 'Създаване на нов профил'}
          </Text>

          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#333333' : '#f5f5f5',
              color: isDark ? '#ffffff' : '#000000',
              borderColor: isDark ? '#444444' : '#e0e0e0'
            }]}
            placeholder="Имейл адрес"
            placeholderTextColor={isDark ? '#888888' : '#999999'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#333333' : '#f5f5f5',
              color: isDark ? '#ffffff' : '#000000',
              borderColor: isDark ? '#444444' : '#e0e0e0'
            }]}
            placeholder="Парола"
            placeholderTextColor={isDark ? '#888888' : '#999999'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {!showLogin && (
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? '#333333' : '#f5f5f5',
                color: isDark ? '#ffffff' : '#000000',
                borderColor: isDark ? '#444444' : '#e0e0e0'
              }]}
              placeholder="Потвърди паролата"
              placeholderTextColor={isDark ? '#888888' : '#999999'}
              secureTextEntry
            />
          )}

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={showLogin ? loginOnly : createAccountAndLogin}
          >
            <Text style={styles.submitButtonText}>
              {showLogin ? 'Вход' : 'Регистрация'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowLogin(!showLogin)}
            style={styles.switchButton}
          >
            <Text style={[styles.switchButtonText, { color: '#0347F2' }]}>
              {showLogin ? 'Нямате профил? Регистрирайте се' : 'Вече имате профил? Вход'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#0347F2',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
  },
  loggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#0347F2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});