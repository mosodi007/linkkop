import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/app/lib/auth.native';
import { useTranslation } from 'react-i18next';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success',
          'Account created! You can now sign in.',
          [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
        );
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
            {t('auth.create_account', 'Create account')}
          </Text>
          <Text className="text-lg text-gray-600 mb-8">
            {t('auth.sign_up_subtitle', 'Get started with Linkkop')}
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

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t('auth.confirm_password', 'Confirm Password')}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 mb-4 ${loading ? 'bg-blue-300' : 'bg-blue-500'}`}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold text-base">
              {loading ? t('auth.creating_account', 'Creating account...') : t('auth.sign_up', 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">
              {t('auth.have_account', 'Already have an account?')}
            </Text>
            <Link href="/auth/sign-in" className="ml-1">
              <Text className="text-blue-500 font-semibold">
                {t('auth.sign_in', 'Sign in')}
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
