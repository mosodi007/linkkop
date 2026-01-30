import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/app/lib/auth.native';
import { useTranslation } from 'react-i18next';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const { signInWithEmail, signInWithPassword } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSignIn() {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      if (useMagicLink) {
        const { error } = await signInWithEmail(email);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Success', 'Check your email for the magic link!');
        }
      } else {
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          return;
        }
        const { error } = await signInWithPassword(email, password);
        if (error) {
          Alert.alert('Error', error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-white">
        <View className="flex-1 px-6 pt-20">
          <Text className="text-4xl font-bold text-gray-900 mb-2">
            {t('auth.welcome_back', 'Welcome back')}
          </Text>
          <Text className="text-lg text-gray-600 mb-8">
            {t('auth.sign_in_subtitle', 'Sign in to continue to Linkkop')}
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.email', 'Email')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {!useMagicLink && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {t('auth.password', 'Password')}
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TouchableOpacity
            className={`rounded-lg py-4 mb-4 ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading ? t('auth.signing_in', 'Signing in...') : t('auth.sign_in', 'Sign In')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setUseMagicLink(!useMagicLink)}>
            <Text className="text-blue-500 text-center text-sm">
              {useMagicLink
                ? t('auth.use_password', 'Use password instead')
                : t('auth.use_magic_link', 'Use magic link instead')}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">
              {t('auth.no_account', "Don't have an account?")}
            </Text>
            <Link href="/auth/sign-up" className="ml-1">
              <Text className="text-blue-500 font-semibold">
                {t('auth.sign_up', 'Sign up')}
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
