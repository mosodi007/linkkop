import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function SignUpRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/onboarding');
  }, [router]);
  return null;
}
