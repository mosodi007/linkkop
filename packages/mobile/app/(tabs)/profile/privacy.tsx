import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../../../lib/ThemeContext';
import { useAuth } from '../../../lib/auth';
import type { ProfileRow } from '@repo/shared';

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

const VISIBILITY_OPTIONS: { value: NonNullable<ProfileRow['post_visibility']>; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'Contacts only' },
  { value: 'only_me', label: 'Only me' },
];

type GenderOption = NonNullable<ProfileRow['show_me_gender']>;
type ScopeOption = NonNullable<ProfileRow['show_me_scope']>;

export default function PrivacyScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [postVisibility, setPostVisibility] = useState<ProfileRow['post_visibility']>('everyone');
  const [profileVisibility, setProfileVisibility] = useState<ProfileRow['profile_visibility']>('everyone');
  const [showMeGender, setShowMeGender] = useState<GenderOption>('both');
  const [showMeScope, setShowMeScope] = useState<ScopeOption>('my_location');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(99);
  const [showMeInterests, setShowMeInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    setPostVisibility(profile.post_visibility ?? 'everyone');
    setProfileVisibility(profile.profile_visibility ?? 'everyone');
    setShowMeGender(profile.show_me_gender ?? 'both');
    setShowMeScope(profile.show_me_scope ?? 'my_location');
    setAgeMin(profile.age_min ?? 18);
    setAgeMax(profile.age_max ?? 99);
    setShowMeInterests(profile.show_me_interests ?? []);
  }, [profile?.id]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { error } = await updateProfile({
      post_visibility: postVisibility,
      profile_visibility: profileVisibility,
      show_me_gender: showMeGender,
      show_me_scope: showMeScope,
      age_min: Math.min(ageMin, ageMax),
      age_max: Math.max(ageMin, ageMax),
      show_me_interests: showMeInterests,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message ?? 'Could not save privacy settings');
    } else {
      Alert.alert('Saved', 'Privacy settings saved');
    }
  }

  function toggleInterest(interest: string) {
    setShowMeInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Control who can see your content and who you see</Text>

        {/* Who can see my posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who can see my posts</Text>
          <View style={styles.optionCard}>
            {VISIBILITY_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.radioRow, idx === VISIBILITY_OPTIONS.length - 1 && styles.radioRowLast]}
                onPress={() => setPostVisibility(opt.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, postVisibility === opt.value && styles.radioOuterChecked]}>
                  {postVisibility === opt.value && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Who can see my profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who can see my profile</Text>
          <View style={styles.optionCard}>
            {VISIBILITY_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.radioRow, idx === VISIBILITY_OPTIONS.length - 1 && styles.radioRowLast]}
                onPress={() => setProfileVisibility(opt.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioOuter, profileVisibility === opt.value && styles.radioOuterChecked]}>
                  {profileVisibility === opt.value && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Show me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Show me</Text>

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.segmentedRow}>
            {(['females', 'males', 'both'] as const).map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.segment, showMeGender === val && styles.segmentActive]}
                onPress={() => setShowMeGender(val)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, showMeGender === val && styles.segmentTextActive]}>
                  {val === 'both' ? 'Both' : val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Location</Text>
          <View style={styles.segmentedRow}>
            <TouchableOpacity
              style={[styles.segment, showMeScope === 'worldwide' && styles.segmentActive]}
              onPress={() => setShowMeScope('worldwide')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, showMeScope === 'worldwide' && styles.segmentTextActive]}>
                Worldwide
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, showMeScope === 'my_location' && styles.segmentActive]}
              onPress={() => setShowMeScope('my_location')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, showMeScope === 'my_location' && styles.segmentTextActive]}>
                My location
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Age range</Text>
          <View style={styles.ageRow}>
            <View style={styles.ageInputWrap}>
              <Text style={styles.ageLabel}>Min</Text>
              <TextInput
                style={styles.ageInput}
                value={String(ageMin)}
                onChangeText={(t) => setAgeMin(Math.min(99, Math.max(18, Number(t) || 18)))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.ageDash}>–</Text>
            <View style={styles.ageInputWrap}>
              <Text style={styles.ageLabel}>Max</Text>
              <TextInput
                style={styles.ageInput}
                value={String(ageMax)}
                onChangeText={(t) => setAgeMax(Math.min(99, Math.max(18, Number(t) || 99)))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Interests</Text>
          <Text style={styles.fieldHint}>Show people who have these interests</Text>
          <View style={styles.chipsRow}>
            {PRESET_INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[styles.chip, showMeInterests.includes(interest) && styles.chipActive]}
                onPress={() => toggleInterest(interest)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, showMeInterests.includes(interest) && styles.chipTextActive]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save privacy settings</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: themeColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.default,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.text.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: themeColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    overflow: 'hidden',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColors.border.light,
  },
  radioRowLast: {
    borderBottomWidth: 0,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: themeColors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterChecked: {
    borderColor: themeColors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.primary,
  },
  radioLabel: {
    fontSize: 16,
    color: themeColors.text.primary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 12,
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    overflow: 'hidden',
    backgroundColor: themeColors.background.card,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: themeColors.secondary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.secondary,
  },
  segmentTextActive: {
    color: themeColors.text.inverse,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  ageInputWrap: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 12,
    color: themeColors.text.muted,
    marginBottom: 4,
  },
  ageInput: {
    backgroundColor: themeColors.background.card,
    borderWidth: 1,
    borderColor: themeColors.border.default,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: themeColors.text.primary,
  },
  ageDash: {
    fontSize: 16,
    color: themeColors.text.muted,
    paddingBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 4,
  },
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
  chipActive: {
    backgroundColor: themeColors.secondary,
    borderColor: themeColors.secondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.secondary,
  },
  chipTextActive: {
    color: themeColors.text.inverse,
  },
  saveBtn: {
    backgroundColor: themeColors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.inverse,
  },
});
