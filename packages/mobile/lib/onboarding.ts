import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingSocialNetworks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface OnboardingPayload {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string; // ISO date YYYY-MM-DD
  interests: string[];
  gender: 'male' | 'female';
  occupationId: string | null;
  countryCode: string; // ISO2 e.g. 'NG'
  phone: string; // full number with dial code
  messenger: string[];
  socialNetworks: OnboardingSocialNetworks;
  profilePhoto: string | null; // file URI or base64/data URL
  bio: string;
  locationEnabled: boolean;
  coords?: { lat: number; lng: number };
  city?: string | null; // from reverse geocode when location enabled
}

export const ONBOARDING_STORAGE_KEY = 'onboarding_data';
export const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export async function getOnboardingComplete(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
  return v === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
}

export async function clearOnboardingComplete(): Promise<void> {
  await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, ONBOARDING_STORAGE_KEY]);
}

export async function saveOnboardingData(payload: OnboardingPayload): Promise<void> {
  const toStore = { ...payload, profilePhoto: null };
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(toStore));
}
