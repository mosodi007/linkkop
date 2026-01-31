import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { themeColors } from '../../lib/ThemeContext';
import { COUNTRY_OPTIONS, getFlagEmoji } from '../../lib/countries';
import { fetchOccupations, type Occupation } from '../../lib/occupations';
import {
  type OnboardingPayload,
  type OnboardingSocialNetworks,
  setOnboardingComplete,
  saveOnboardingData,
} from '../../lib/onboarding';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

const PRESET_INTERESTS = [
  'Business',
  'Tech',
  'Networking',
  'Fashion',
  'Art',
  'Music',
  'Finance',
  'Education',
  'Sports',
  'Travel',
];

const MESSENGER_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'signal', label: 'Signal' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'viber', label: 'Viber' },
  { value: 'wechat', label: 'WeChat' },
  { value: 'line', label: 'LINE' },
  { value: 'imo', label: 'IMO' },
] as const;

const STEPS = [
  { title: 'Account', fields: ['email', 'password', 'confirmPassword'] },
  { title: 'Basics', fields: ['fullName', 'dateOfBirth', 'interests', 'gender', 'occupation'] },
  { title: 'Contact', fields: ['countryCode', 'phone', 'messenger'] },
  { title: 'Social', fields: ['socialNetworks'] },
  { title: 'Profile', fields: ['profilePhoto', 'bio'] },
  { title: 'Location', fields: ['locationEnabled'] },
];

const defaultSocial: OnboardingSocialNetworks = {};

function base64ToBinary(base64: string): string {
  if (typeof atob !== 'undefined') return atob(base64);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let binary = '';
  base64 = base64.replace(/=+$/, '');
  for (let i = 0; i < base64.length; i += 4) {
    const a = chars.indexOf(base64[i]);
    const b = chars.indexOf(base64[i + 1]);
    const c = chars.indexOf(base64[i + 2]);
    const d = chars.indexOf(base64[i + 3]);
    binary += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== -1) binary += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== -1) binary += String.fromCharCode(((c & 3) << 6) | d);
  }
  return binary;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [occupationId, setOccupationId] = useState<string | null>(null);
  const [occupationModalVisible, setOccupationModalVisible] = useState(false);
  const [occupationSearch, setOccupationSearch] = useState('');
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [occupationsLoading, setOccupationsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState('NG');
  const [phone, setPhone] = useState('');
  const [messenger, setMessenger] = useState<string[]>([]);
  const [socialNetworks, setSocialNetworks] = useState<OnboardingSocialNetworks>(defaultSocial);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [profilePhotoBase64, setProfilePhotoBase64] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [city, setCity] = useState<string | null>(null);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((c) => c.value === countryCode),
    [countryCode]
  );
  const dialCode = selectedCountry?.dialCode ?? '+234';

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_OPTIONS;
    const q = countrySearch.trim().toLowerCase();
    return COUNTRY_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.dialCode.toLowerCase().includes(q) ||
        o.dialCode.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  }, [countrySearch]);

  useEffect(() => {
    if (!occupationModalVisible) return;
    setOccupationsLoading(true);
    fetchOccupations()
      .then(setOccupations)
      .finally(() => setOccupationsLoading(false));
  }, [occupationModalVisible]);

  const filteredOccupations = useMemo(() => {
    if (!occupationSearch.trim()) return occupations;
    const q = occupationSearch.trim().toLowerCase();
    return occupations.filter((o) => o.name.toLowerCase().includes(q));
  }, [occupations, occupationSearch]);

  const selectedOccupation = useMemo(
    () => occupations.find((o) => o.id === occupationId),
    [occupations, occupationId]
  );

  const insets = useSafeAreaInsets();

  function validateStep(): boolean {
    const nextErrors: Record<string, string> = {};
    if (step === 0) {
      if (!email.trim()) nextErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email';
      if (!password) nextErrors.password = 'Create a password';
      else if (password.length < 6) nextErrors.password = 'At least 6 characters';
      if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (step === 1) {
      if (!fullName.trim()) nextErrors.fullName = 'Full name is required';
      if (!dateOfBirth.trim()) nextErrors.dateOfBirth = 'Date of birth is required';
      else {
        const d = new Date(dateOfBirth);
        if (isNaN(d.getTime()) || d > new Date()) nextErrors.dateOfBirth = 'Enter a valid date (YYYY-MM-DD)';
      }
      if (interests.length === 0) nextErrors.interests = 'Select at least one interest';
      if (!gender) nextErrors.gender = 'Select your gender';
      if (!occupationId) nextErrors.occupation = 'Select your work';
    }
    if (step === 2) {
      if (!phone.trim()) nextErrors.phone = 'Phone number is required';
      if (messenger.length === 0) nextErrors.messenger = 'Select at least one messenger';
    }
    if (step === 3) {
      const hasHandle = Object.values(socialNetworks).some(
        (v) => typeof v === 'string' && v.trim().length > 0
      );
      if (!hasHandle) nextErrors.socialNetworks = 'Enter at least one handle';
    }
    if (step === 4) {
      if (!profilePhotoUri && !profilePhotoBase64) nextErrors.profilePhoto = 'Profile photo is required';
      if (!bio.trim()) nextErrors.bio = 'Bio is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const canGoNext = useMemo(() => {
    if (step === 0) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      const passwordOk = password.length >= 6;
      const confirmOk = password === confirmPassword;
      return emailOk && passwordOk && confirmOk;
    }
    if (step === 1) {
      const nameOk = fullName.trim().length > 0;
      const dobOk =
        dateOfBirth.trim().length > 0 &&
        !isNaN(new Date(dateOfBirth).getTime()) &&
        new Date(dateOfBirth) <= new Date();
      const interestsOk = interests.length >= 1;
      const genderOk = gender === 'male' || gender === 'female';
      const occupationOk = occupationId != null && occupationId.length > 0;
      return nameOk && dobOk && interestsOk && genderOk && occupationOk;
    }
    if (step === 2) {
      const phoneOk = phone.trim().length > 0;
      const messengerOk = messenger.length >= 1;
      return phoneOk && messengerOk;
    }
    if (step === 3) {
      return Object.values(socialNetworks).some(
        (v) => typeof v === 'string' && v.trim().length > 0
      );
    }
    if (step === 4) {
      const hasPhoto = profilePhotoUri != null || profilePhotoBase64 != null;
      const hasBio = bio.trim().length > 0;
      return hasPhoto && hasBio;
    }
    return true; // step 5 (Location)
  }, [
    step,
    email,
    password,
    confirmPassword,
    fullName,
    dateOfBirth,
    interests,
    phone,
    messenger,
    socialNetworks,
    profilePhotoUri,
    profilePhotoBase64,
    bio,
  ]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  function toggleMessenger(value: string) {
    setMessenger((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]
    );
  }

  const datePickerValue = dateOfBirth.trim()
    ? (() => {
        const d = new Date(dateOfBirth);
        return isNaN(d.getTime()) ? new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000) : d;
      })()
    : new Date(Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000);

  const formattedDateOfBirth = dateOfBirth.trim()
    ? (() => {
        const d = new Date(dateOfBirth);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      })()
    : '';

  function onDatePickerChange(event: DateTimePickerEvent, selectedDate: Date | undefined) {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate.toISOString().slice(0, 10));
    }
  }

  const pickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1] as [number, number],
    quality: 0.8,
    base64: true,
  };

  async function pickImageFromLibrary() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to add a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePhotoUri(asset.uri);
        setProfilePhotoBase64(asset.base64 ?? null);
      }
    } catch (err) {
      console.warn('Image picker (library) error', err);
      Alert.alert('Error', 'Could not open the photo library. Please try again.');
    }
  }

  async function pickImageFromCamera() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take a profile photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync(pickerOptions);
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setProfilePhotoUri(asset.uri);
        setProfilePhotoBase64(asset.base64 ?? null);
      }
    } catch (err) {
      console.warn('Image picker (camera) error', err);
      Alert.alert('Error', 'Could not open the camera. Please try again.');
    }
  }

  function pickImage() {
    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Take Photo', onPress: pickImageFromCamera },
      { text: 'Choose from Library', onPress: pickImageFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleLocationToggle(value: boolean) {
    setLocationEnabled(value);
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationEnabled(false);
        Alert.alert('Permission needed', 'Allow location to find people near you.');
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setCoords({ lat, lng });
        try {
          const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          const cityName = address?.city ?? address?.district ?? address?.subregion ?? address?.region ?? null;
          setCity(cityName);
        } catch {
          setCity(null);
        }
      } catch {
        setLocationEnabled(false);
        setCity(null);
      }
    } else {
      setCoords(undefined);
      setCity(null);
    }
  }

  async function handleNext() {
    Keyboard.dismiss();
    if (!validateStep()) return;
    if (isLastStep) {
      setLoading(true);
      const fullPhone = dialCode + phone.trim().replace(/\D/g, '');
      const payload: OnboardingPayload = {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        interests,
        gender: gender ?? 'male',
        occupationId,
        countryCode,
        phone: fullPhone,
        messenger,
        socialNetworks,
        profilePhoto: profilePhotoUri,
        bio: bio.trim(),
        locationEnabled,
        coords,
        city: locationEnabled ? city : null,
      };

      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
        });
        if (authError) {
          setLoading(false);
          Alert.alert('Error', authError.message);
          return;
        }
        const user = authData?.user;
        if (!user) {
          setLoading(false);
          Alert.alert('Success', 'Check your email to confirm your account.');
          router.replace('/auth/sign-in');
          return;
        }

        let avatarUrl: string | null = null;
        if (profilePhotoBase64) {
          try {
            const path = `${user.id}/avatar.jpg`;
            const contentType = 'image/jpeg';
            const binaryString = base64ToBinary(profilePhotoBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(path, bytes, { upsert: true, contentType });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
              avatarUrl = urlData?.publicUrl ?? null;
            }
          } catch (uploadErr) {
            console.warn('Avatar upload failed', uploadErr);
          }
        }

        const dateOnly = payload.dateOfBirth ? payload.dateOfBirth.slice(0, 10) : null;
        const profileRow = {
          id: user.id,
          full_name: payload.fullName,
          date_of_birth: dateOnly,
          interests: payload.interests?.length ? payload.interests : [],
          phone: payload.phone?.trim() || null,
          messenger: Array.isArray(payload.messenger) && payload.messenger.length > 0 ? payload.messenger : [],
          social_networks: payload.socialNetworks && Object.keys(payload.socialNetworks).length ? payload.socialNetworks : {},
          avatar_url: avatarUrl,
          bio: payload.bio || null,
          location_enabled: payload.locationEnabled ?? false,
          lat: payload.coords?.lat ?? null,
          lng: payload.coords?.lng ?? null,
          city: payload.city?.trim() || null,
          country: payload.countryCode?.trim() || null,
          gender: payload.gender || null,
          occupation_id: payload.occupationId || null,
        };
        const { error: profileError } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
        if (profileError) {
          setLoading(false);
          Alert.alert('Error', profileError.message);
          return;
        }
        // Fetch profile (including avatar_url) for the new user so the app shows it right away
        await refreshProfile(user.id);
        setLoading(false);
        setTimeout(() => router.replace('/(tabs)'), 0);
        return;
      }

      try {
        await saveOnboardingData(payload);
        await setOnboardingComplete();
      } catch (_) {}
      setLoading(false);
      router.replace('/(tabs)');
      return;
    }
    setStep((s) => s + 1);
    setErrors({});
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
    setErrors({});
  }

  const stepTitles: Record<number, { title: string; subtitle: string }> = {
    0: { title: 'Create your account', subtitle: 'We’ll use this to sign you in and keep your profile secure.' },
    1: { title: 'About you', subtitle: 'Help others find you with a few basics.' },
    2: { title: 'How to reach you', subtitle: 'Add your phone and preferred messengers.' },
    3: { title: 'Social links', subtitle: 'Optional — connect your profiles.' },
    4: { title: 'Your profile', subtitle: 'A photo and short bio go a long way.' },
    5: { title: 'Location', subtitle: 'Find people near you.' },
  };
  const { title: stepTitle, subtitle: stepSubtitle } = stepTitles[step] ?? { title: '', subtitle: '' };
  const progressPercent = ((step + 1) / STEPS.length) * 100;
  const floatingFooterHeight = 52 + 16 + 32 + (insets.bottom + 12);
  const scrollPaddingBottom = floatingFooterHeight + 24;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Header with back arrow and logo */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step > 0 ? (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.headerBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerBackPlaceholder} />
            )}
            <Image source={require('../../public/Linkkop.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.headerBackPlaceholder} />
          </View>
          <View style={styles.progressBarWrap}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.stepBadge}>Step {step + 1} of {STEPS.length}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{stepTitle}</Text>
            <Text style={styles.stepSubtitle}>{stepSubtitle}</Text>
          </View>

          <View style={styles.formCard}>
          {/* Step 0: Account */}
          {step === 0 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.text.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Create password</Text>
                <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
                  <TextInput
                    style={styles.inputFlex}
                    placeholder="••••••••"
                    placeholderTextColor={themeColors.text.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={themeColors.text.muted} />
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={[styles.inputRow, errors.confirmPassword ? styles.inputError : null]}>
                  <TextInput
                    style={styles.inputFlex}
                    placeholder="••••••••"
                    placeholderTextColor={themeColors.text.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={themeColors.text.muted} />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>
            </View>
          )}

          {/* Step 1: Basics */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={[styles.input, errors.fullName ? styles.inputError : null]}
                  placeholder="Your full name"
                  placeholderTextColor={themeColors.text.muted}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
                {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of birth</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInputTouchable, errors.dateOfBirth ? styles.inputError : null]}
                  onPress={() => !loading && setShowDatePicker(true)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={formattedDateOfBirth ? styles.dateInputText : styles.dateInputPlaceholder}>
                    {formattedDateOfBirth || 'Select date of birth'}
                  </Text>
                  <Ionicons name="calendar-outline" size={22} color={themeColors.text.muted} />
                </TouchableOpacity>
                {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
              </View>

              {/* Date picker in Modal so it displays reliably on real devices (avoids ScrollView/layout issues) */}
              <Modal
                visible={showDatePicker}
                transparent
                animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
                onRequestClose={() => setShowDatePicker(false)}
              >
                <Pressable style={styles.datePickerModalOverlay} onPress={() => setShowDatePicker(false)}>
                  <View style={styles.datePickerModalContent} onStartShouldSetResponder={() => true}>
                    <View style={styles.datePickerSpinnerWrap}>
                      <DateTimePicker
                        value={datePickerValue}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDatePickerChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        style={Platform.OS === 'ios' ? styles.datePickerSpinner : undefined}
                      />
                    </View>
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={styles.datePickerDoneBtn}
                        onPress={() => setShowDatePicker(false)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.datePickerDoneBtnText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Pressable>
              </Modal>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Interests</Text>
                <View style={styles.chipsRow}>
                  {PRESET_INTERESTS.map((interest) => (
                    <TouchableOpacity
                      key={interest}
                      style={[styles.chip, interests.includes(interest) && styles.chipActive]}
                      onPress={() => toggleInterest(interest)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, interests.includes(interest) && styles.chipTextActive]}>{interest}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.interests ? <Text style={styles.errorText}>{errors.interests}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipsRow}>
                  <TouchableOpacity
                    style={[styles.chip, gender === 'male' && styles.chipActive]}
                    onPress={() => setGender('male')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, gender === 'male' && styles.chipTextActive]}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, gender === 'female' && styles.chipActive]}
                    onPress={() => setGender('female')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, gender === 'female' && styles.chipTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
                {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateInputTouchable, errors.occupation ? styles.inputError : null]}
                  onPress={() => !loading && setOccupationModalVisible(true)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={selectedOccupation ? styles.dateInputText : styles.dateInputPlaceholder}>
                    {selectedOccupation ? selectedOccupation.name : 'Select work'}
                  </Text>
                  <Ionicons name="chevron-down" size={22} color={themeColors.text.muted} />
                </TouchableOpacity>
                {errors.occupation ? <Text style={styles.errorText}>{errors.occupation}</Text> : null}
              </View>
            </View>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => {
                      setCountrySearch('');
                      setCountryModalVisible(true);
                    }}
                  >
                    {selectedCountry ? (
                      <>
                        <Text style={styles.countryFlag}>{getFlagEmoji(selectedCountry.iso2)}</Text>
                        <Text style={styles.countryBtnText}>{dialCode}</Text>
                      </>
                    ) : (
                      <Text style={styles.countryBtnText}>{dialCode}</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={themeColors.text.secondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.phoneInput, errors.phone ? styles.inputError : null]}
                    placeholder="XXX XXX XXXX"
                    placeholderTextColor={themeColors.text.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Messengers</Text>
                <Text style={styles.hint}>Select all the messengers your number is available on.</Text>
                <View style={styles.chipsRow}>
                  {MESSENGER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.chip, messenger.includes(opt.value) && styles.chipActive]}
                      onPress={() => toggleMessenger(opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, messenger.includes(opt.value) && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.messenger ? <Text style={styles.errorText}>{errors.messenger}</Text> : null}
              </View>
            </View>
          )}

          {/* Step 3: Social */}
          {step === 3 && (
            <View style={styles.form}>
              {errors.socialNetworks ? (
                <Text style={[styles.errorText, { marginBottom: 8 }]}>{errors.socialNetworks}</Text>
              ) : null}
              {(['instagram', 'facebook', 'twitter', 'linkedin'] as const).map((key) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={styles.label}>{key === 'twitter' ? 'X (Twitter)' : key}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="@handle or URL"
                    placeholderTextColor={themeColors.text.muted}
                    value={socialNetworks[key] ?? ''}
                    onChangeText={(t) => setSocialNetworks((prev) => ({ ...prev, [key]: t || undefined }))}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Step 4: Profile */}
          {step === 4 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Profile photo</Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.8}>
                    {profilePhotoUri ? (
                      <Image source={{ uri: profilePhotoUri }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, errors.profilePhoto ? styles.inputError : null]}>
                        <Ionicons name="camera-outline" size={32} color={themeColors.text.muted} />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                    <Text style={styles.addPhotoBtnText}>Add photo</Text>
                  </TouchableOpacity>
                </View>
                {errors.profilePhoto ? <Text style={styles.errorText}>{errors.profilePhoto}</Text> : null}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput, errors.bio ? styles.inputError : null]}
                  placeholder="A short bio about you"
                  placeholderTextColor={themeColors.text.muted}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
                {errors.bio ? <Text style={styles.errorText}>{errors.bio}</Text> : null}
              </View>
            </View>
          )}

          {/* Step 5: Location */}
          {step === 5 && (
            <View style={styles.form}>
              <Text style={styles.locationDesc}>
                Enable location to find people near you. We use your location only to show nearby contacts and posts.
              </Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Enable location</Text>
                <Switch
                  value={locationEnabled}
                  onValueChange={handleLocationToggle}
                  trackColor={{ false: themeColors.border.default, true: themeColors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}

          </View>
        </ScrollView>

        {/* Floating Next button - above keyboard via KeyboardAvoidingView */}
        <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              styles.btnSingle,
              (loading || !canGoNext) && styles.btnDisabled,
            ]}
            onPress={handleNext}
            disabled={loading || !canGoNext}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>{isLastStep ? 'Complete' : 'Next'}</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={countryModalVisible} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setCountryModalVisible(false);
            setCountrySearch('');
          }}
        >
          <View style={styles.modalContent} pointerEvents="box-none">
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select country</Text>
            <Text style={styles.modalSubtitle}>Your phone number will use this dial code.</Text>
            <View style={styles.modalSearchWrap} pointerEvents="box-none">
              <Ionicons name="search" size={20} color={themeColors.text.muted} style={styles.modalSearchIcon} pointerEvents="none" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search country or code..."
                placeholderTextColor={themeColors.text.muted}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
            {filteredCountries.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <Text style={styles.modalEmptyText}>No countries match your search.</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCountries}
                extraData={countrySearch}
                keyExtractor={(c) => c.value}
                style={styles.modalList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: c }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, countryCode === c.value && styles.modalOptionActive]}
                    onPress={() => {
                      setCountryCode(c.value);
                      setCountryModalVisible(false);
                      setCountrySearch('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalOptionFlag}>{getFlagEmoji(c.iso2)}</Text>
                    <Text style={styles.modalOptionLabel} numberOfLines={1}>
                      {c.label.replace(` (${c.dialCode})`, '')}
                    </Text>
                    <Text style={styles.modalOptionDial}>{c.dialCode}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Work picker: dropdown with search, keyboard avoiding */}
      <Modal visible={occupationModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setOccupationModalVisible(false);
              setOccupationSearch('');
            }}
          >
            <View style={styles.modalContent} pointerEvents="box-none" onStartShouldSetResponder={() => true}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select work</Text>
              <Text style={styles.modalSubtitle}>Search or scroll to choose your work.</Text>
              <View style={styles.modalSearchWrap} pointerEvents="box-none">
                <Ionicons name="search" size={20} color={themeColors.text.muted} style={styles.modalSearchIcon} pointerEvents="none" />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search work..."
                  placeholderTextColor={themeColors.text.muted}
                  value={occupationSearch}
                  onChangeText={setOccupationSearch}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              </View>
              {occupationsLoading ? (
                <View style={styles.modalEmptyWrap}>
                  <ActivityIndicator size="small" color={themeColors.text.muted} />
                  <Text style={[styles.modalEmptyText, { marginTop: 8 }]}>Loading…</Text>
                </View>
              ) : filteredOccupations.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <Text style={styles.modalEmptyText}>No work matches your search.</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredOccupations}
                  extraData={occupationSearch}
                  keyExtractor={(o) => o.id}
                  style={styles.modalList}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  renderItem={({ item: o }) => (
                    <TouchableOpacity
                      style={[styles.modalOption, occupationId === o.id && styles.modalOptionActive]}
                      onPress={() => {
                        setOccupationId(o.id);
                        setOccupationModalVisible(false);
                        setOccupationSearch('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalOptionLabel} numberOfLines={1}>{o.name}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: themeColors.background.screen },
  container: { flex: 1, backgroundColor: themeColors.background.screen },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: themeColors.background.screen,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackPlaceholder: {
    width: 40,
    height: 40,
  },
  logo: {
    height: 32,
    width: 90,
  },
  progressBarWrap: {
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: themeColors.border.default,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: themeColors.primary,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.text.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  stepHeader: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: themeColors.text.secondary,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: themeColors.background.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: themeColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  form: { marginBottom: 0 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: themeColors.text.primary, marginBottom: 8 },
  hint: { fontSize: 13, color: themeColors.text.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border.default,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: themeColors.text.primary,
    backgroundColor: themeColors.background.input,
  },
  inputError: { borderColor: '#dc2626' },
  dateInputTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: { fontSize: 16, color: themeColors.text.primary },
  dateInputPlaceholder: { fontSize: 16, color: themeColors.text.muted },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: 280,
  },
  datePickerSpinnerWrap: {
    alignItems: 'center',
    minHeight: 220,
  },
  datePickerSpinner: {
    height: 216,
    width: '100%',
  },
  datePickerDoneBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
  },
  datePickerDoneBtnText: { fontSize: 16, fontWeight: '600', color: themeColors.text.inverse },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border.default,
    borderRadius: 14,
    backgroundColor: themeColors.background.input,
    paddingHorizontal: 16,
  },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 16, color: themeColors.text.primary },
  eyeBtn: { padding: 8 },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.input,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: themeColors.text.secondary },
  chipTextActive: { color: themeColors.text.inverse },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.input,
    minWidth: 96,
  },
  countryFlag: { fontSize: 18, lineHeight: 20 },
  countryBtnText: { fontSize: 16, color: themeColors.text.primary, fontWeight: '600' },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: themeColors.border.default, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: themeColors.text.primary, backgroundColor: themeColors.background.input },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatarWrap: { alignSelf: 'flex-start' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: themeColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: themeColors.border.default,
    borderStyle: 'dashed',
  },
  addPhotoBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: themeColors.primary,
    backgroundColor: 'transparent',
  },
  addPhotoBtnText: { fontSize: 15, fontWeight: '600', color: themeColors.primary },
  bioInput: { minHeight: 110, textAlignVertical: 'top' },
  locationDesc: { fontSize: 15, color: themeColors.text.secondary, marginBottom: 20, lineHeight: 22 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.input,
  },
  switchLabel: { fontSize: 16, fontWeight: '500', color: themeColors.text.primary },
  floatingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: themeColors.background.screen,
    borderTopWidth: 1,
    borderTopColor: themeColors.border.light,
    shadowColor: themeColors.secondary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 10,
  },
  btnSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    minHeight: 52,
    marginBottom: 20,
  },
  btnPrimary: { backgroundColor: '#000' },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: themeColors.primary },
  btnDisabled: { opacity: 0.7 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  footerText: { fontSize: 14, color: themeColors.text.muted },
  footerLink: { fontSize: 14, fontWeight: '600', color: themeColors.primary },
  modalKeyboardAvoid: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: themeColors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.border.default,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: themeColors.text.primary, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: themeColors.text.muted, marginBottom: 16 },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.input,
  },
  modalSearchIcon: { marginRight: 10 },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: themeColors.text.primary,
    paddingVertical: 4,
  },
  modalEmptyWrap: { paddingVertical: 32, alignItems: 'center' },
  modalEmptyText: { fontSize: 15, color: themeColors.text.muted },
  modalList: { maxHeight: 320 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.default,
  },
  modalOptionActive: { backgroundColor: themeColors.background.muted ?? 'rgba(0,0,0,0.05)' },
  modalOptionFlag: { fontSize: 22, lineHeight: 24, marginRight: 12 },
  modalOptionLabel: { flex: 1, fontSize: 16, color: themeColors.text.primary, marginRight: 8 },
  modalOptionDial: { fontSize: 15, color: themeColors.text.muted, fontWeight: '600' },
});
