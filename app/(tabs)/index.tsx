import ThemeToggleButton from '@/components/CustomHeader';
import ModMainScreen from '@/components/moderator-part-components/ModMainScreen';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const {
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
    clearCredentials
  } = useUser();
  
  const [showLogin, setShowLogin] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');

  const PlaceholderImage = require('@/assets/icons/logo.png');
  useNotifications();
  
  useEffect(() => {
    setConfirmPassword('');
  }, [showLogin]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Моля, въведете имейл и парола');
      return;
    }

    try {
      await login(email, password);
      Alert.alert('Success', 'Успешен вход!');
    } catch (error: any) {
      Alert.alert('Error', `Входът неуспешен: ${error.message}`);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Моля, въведете имейл и парола');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Паролата трябва да бъде поне 8 символа');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Паролите не съвпадат');
      return;
    }

    try {
      await register(email, password);
      Alert.alert('Success', 'Акаунтът е създаден и влезли сте успешно!');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        Alert.alert('Info', 'Потребителят вече съществува, опитайте да влезете');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
        <ThemeToggleButton />
        <View style={styles.loadingContainer}>
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Зареждане...</Text>
        </View>
      </View>
    );
  }

  if (isLoggedIn && user) {
    return (
      <View style={styles.container}>
      <ThemeToggleButton/>
      <ModMainScreen/>
      </View>
      // <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
      //   <ThemeToggleButton />
      //   <View style={styles.loggedInContainer}>
      //     <Text style={[styles.welcomeText, { color: isDark ? '#ffffff' : '#000000' }]}>
      //       Добре дошли!
      //     </Text>
      //     <Text style={[styles.emailText, { color: isDark ? '#888888' : '#666666' }]}>
      //       {user.email}
      //     </Text>
      //     <Text style={[styles.nameText, { color: isDark ? '#888888' : '#666666' }]}>
      //       {user.name}
      //     </Text>
      //     <Text style={[styles.nameText, { color: isDark ? '#888888' : '#666666' }]}>
      //       {user.role ? <Text>{user.role}</Text> : <Text>No roles</Text>}
      //     </Text>
      //   </View>
      // </View>
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
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={showLogin ? handleLogin : handleRegister}
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
    marginBottom: 8,
  },
  nameText: {
    fontSize: 14,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});