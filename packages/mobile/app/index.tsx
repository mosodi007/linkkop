import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.welcome}>
        <Image source={require('../public/Linkkop.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.tagline}>Find your people</Text>
        <ActivityIndicator size="large" color="#41C28A" style={styles.spinner} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/sign-in" />;
}

const styles = StyleSheet.create({
  welcome: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    height: 56,
    width: 200,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#41C28A',
    marginBottom: 32,
  },
  spinner: {
    marginTop: 16,
  },
});
