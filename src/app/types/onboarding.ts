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
  dateOfBirth: string; // ISO date
  interests: string[];
  phone: string;
  messenger: string[];
  socialNetworks: OnboardingSocialNetworks;
  profilePhoto: string | null; // data URL or null
  bio: string;
  locationEnabled: boolean;
  coords?: { lat: number; lng: number };
}

export const ONBOARDING_STORAGE_KEY = 'onboarding_data';
export const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';
