import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Image source={require('../public/Linkkop.png')} style={styles.logo} resizeMode="contain" />
        <Ionicons name="home" size={48} color="#41C28A" style={styles.icon} />
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.description}>This screen doesn't exist.</Text>
        <Link href="/auth/sign-in" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Go to sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  logo: {
    height: 44,
    width: 160,
    marginBottom: 16,
  },
  icon: { marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#1e293b',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#41C28A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
