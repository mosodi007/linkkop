import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { themeColors } from '../../lib/ThemeContext';
import {
  type OnboardingPayload,
  type OnboardingSocialNetworks,
  setOnboardingComplete,
  saveOnboardingData,
} from '../../lib/onboarding';
import { supabase } from '../../lib/supabase';

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

const COUNTRY_OPTIONS = [
  { value: 'NG', dialCode: '+234', label: 'Nigeria' },
  { value: 'US', dialCode: '+1', label: 'United States' },
  { value: 'GB', dialCode: '+44', label: 'United Kingdom' },
  { value: 'KE', dialCode: '+254', label: 'Kenya' },
  { value: 'GH', dialCode: '+233', label: 'Ghana' },
  { value: 'ZA', dialCode: '+27', label: 'South Africa' },
  { value: 'CA', dialCode: '+1', label: 'Canada' },
  { value: 'IN', dialCode: '+91', label: 'India' },
];

const STEPS = [
  { title: 'Account', fields: ['email', 'password', 'confirmPassword'] },
  { title: 'Basics', fields: ['fullName', 'dateOfBirth', 'interests'] },
  { title: 'Contact', fields: ['countryCode', 'phone', 'messenger'] },
  { title: 'Social', fields: ['socialNetworks'] },
  { title: 'Profile', fields: ['profilePhoto', 'bio'] },
  { title: 'Location', fields: ['locationEnabled'] },
];

const defaultSocial: OnboardingSocialNetworks = {};

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
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
  const [bio, setBio] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const dialCode = COUNTRY_OPTIONS.find((c) => c.value === countryCode)?.dialCode ?? '+234';

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
    }
    if (step === 2) {
      if (!phone.trim()) nextErrors.phone = 'Phone number is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

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

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePhotoUri(result.assets[0].uri);
    }
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
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocationEnabled(false);
      }
    } else {
      setCoords(undefined);
    }
  }

  async function handleNext() {
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
        phone: fullPhone,
        messenger,
        socialNetworks,
        profilePhoto: profilePhotoUri,
        bio: bio.trim(),
        locationEnabled,
        coords,
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
        if (profilePhotoUri) {
          const ext = profilePhotoUri.split('.').pop() || 'jpg';
          const path = `${user.id}/avatar.${ext}`;
          const response = await fetch(profilePhotoUri);
          const blob = await response.blob();
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            avatarUrl = urlData?.publicUrl ?? null;
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
          city: null,
        };
        const { error: profileError } = await supabase.from('profiles').upsert(profileRow, { onConflict: 'id' });
        if (profileError) {
          setLoading(false);
          Alert.alert('Error', profileError.message);
          return;
        }
        setLoading(false);
        router.replace('/(tabs)');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressWrap}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.progressDot, i <= step ? styles.progressDotActive : null]}
              />
            ))}
          </View>
          <Text style={styles.stepLabel}>
            Step {step + 1} of {STEPS.length}
          </Text>

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
                <TextInput
                  style={[styles.input, errors.dateOfBirth ? styles.inputError : null]}
                  placeholder="YYYY-MM-DD (e.g. 1990-01-15)"
                  placeholderTextColor={themeColors.text.muted}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  editable={!loading}
                />
                {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
              </View>
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
                    onPress={() => setCountryModalVisible(true)}
                  >
                    <Text style={styles.countryBtnText}>{dialCode}</Text>
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
              </View>
            </View>
          )}

          {/* Step 3: Social */}
          {step === 3 && (
            <View style={styles.form}>
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
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons name="camera-outline" size={32} color={themeColors.text.muted} />
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                    <Text style={styles.addPhotoBtnText}>Add photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="A short bio about you"
                  placeholderTextColor={themeColors.text.muted}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
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

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={handleBack}
              disabled={step === 0 || loading}
            >
              <Text style={styles.btnSecondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>{isLastStep ? 'Complete' : 'Next'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={countryModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCountryModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Country</Text>
            <ScrollView style={styles.modalList}>
              {COUNTRY_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={styles.modalOption}
                  onPress={() => {
                    setCountryCode(c.value);
                    setCountryModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{c.label} ({c.dialCode})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: themeColors.background.screen },
  container: { flex: 1, backgroundColor: themeColors.background.screen },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 },
  progressWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: themeColors.border.default,
  },
  progressDotActive: {
    backgroundColor: themeColors.secondary,
  },
  stepLabel: {
    fontSize: 14,
    color: themeColors.text.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: themeColors.text.primary, marginBottom: 8 },
  hint: { fontSize: 13, color: themeColors.text.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: themeColors.border.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: themeColors.text.primary,
    backgroundColor: themeColors.background.card,
  },
  inputError: { borderColor: '#dc2626' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border.default,
    borderRadius: 12,
    backgroundColor: themeColors.background.card,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 16, color: themeColors.text.primary },
  eyeBtn: { padding: 8 },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.card,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: themeColors.secondary, borderColor: themeColors.secondary },
  chipText: { fontSize: 14, fontWeight: '500', color: themeColors.text.secondary },
  chipTextActive: { color: themeColors.text.inverse },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.card,
    minWidth: 90,
  },
  countryBtnText: { fontSize: 16, color: themeColors.text.primary, fontWeight: '500' },
  phoneInput: { flex: 1, borderWidth: 1, borderColor: themeColors.border.default, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: themeColors.text.primary, backgroundColor: themeColors.background.card },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { alignSelf: 'flex-start' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: themeColors.background.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border.default,
  },
  addPhotoBtnText: { fontSize: 15, fontWeight: '500', color: themeColors.text.primary },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  locationDesc: { fontSize: 14, color: themeColors.text.secondary, marginBottom: 16, lineHeight: 20 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    backgroundColor: themeColors.background.card,
  },
  switchLabel: { fontSize: 16, color: themeColors.text.primary },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnSecondary: { borderWidth: 1, borderColor: themeColors.border.default, backgroundColor: themeColors.background.card },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: themeColors.text.secondary },
  btnPrimary: { backgroundColor: themeColors.secondary },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: themeColors.text.inverse },
  btnDisabled: { opacity: 0.7 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  footerText: { fontSize: 14, color: themeColors.text.muted },
  footerLink: { fontSize: 14, fontWeight: '600', color: themeColors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: themeColors.background.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: themeColors.text.primary, marginBottom: 16 },
  modalList: { maxHeight: 320 },
  modalOption: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.border.default },
  modalOptionText: { fontSize: 16, color: themeColors.text.primary },
});
