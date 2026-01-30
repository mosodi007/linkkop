import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/app/lib/auth';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';
import type { ProfileRow } from '@/app/types/database';

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

const VISIBILITY_OPTIONS: { value: ProfileRow['post_visibility']; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'contacts', label: 'Contacts only' },
  { value: 'only_me', label: 'Only me' },
];

type GenderOption = NonNullable<ProfileRow['show_me_gender']>;
type ScopeOption = NonNullable<ProfileRow['show_me_scope']>;

export function PrivacyPage() {
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
      toast.error(error.message ?? 'Could not save privacy settings');
    } else {
      toast.success('Privacy settings saved');
    }
  }

  function toggleInterest(interest: string) {
    setShowMeInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Privacy</h1>
        <p className="text-sm text-neutral-500 mb-6">Control who can see your content and who you see</p>

        {/* Who can see my posts */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">Who can see my posts</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0"
              >
                <input
                  type="radio"
                  name="post_visibility"
                  value={opt.value}
                  checked={postVisibility === opt.value}
                  onChange={() => setPostVisibility(opt.value)}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-500"
                />
                <span className="text-neutral-900">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Who can see my profile */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">Who can see my profile</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-100 last:border-0"
              >
                <input
                  type="radio"
                  name="profile_visibility"
                  value={opt.value}
                  checked={profileVisibility === opt.value}
                  onChange={() => setProfileVisibility(opt.value)}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-500"
                />
                <span className="text-neutral-900">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Show me */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-neutral-900 mb-3">Show me</h2>

          <div className="space-y-6">
            {/* Females | Males | Both */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Gender</p>
              <div className="flex rounded-xl border border-neutral-200 overflow-hidden bg-white">
                {(['females', 'males', 'both'] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setShowMeGender(val)}
                    className={`flex-1 py-3 px-4 text-sm font-medium capitalize transition-colors ${
                      showMeGender === val
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {val === 'both' ? 'Both' : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Worldwide (Pro) | My Location (Default) */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Location</p>
              <div className="flex rounded-xl border border-neutral-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowMeScope('worldwide')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    showMeScope === 'worldwide'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  Worldwide
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-xs font-medium">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeScope('my_location')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    showMeScope === 'my_location'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  My location
                  <span className="ml-1 text-xs opacity-80">(Default)</span>
                </button>
              </div>
            </div>

            {/* Age range */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Age range</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="age_min" className="text-xs text-neutral-500">
                    Min
                  </Label>
                  <Input
                    id="age_min"
                    type="number"
                    min={18}
                    max={99}
                    value={ageMin}
                    onChange={(e) => setAgeMin(Number(e.target.value) || 18)}
                    className="mt-1 bg-white border-neutral-200"
                  />
                </div>
                <span className="text-neutral-400 pt-5">–</span>
                <div className="flex-1">
                  <Label htmlFor="age_max" className="text-xs text-neutral-500">
                    Max
                  </Label>
                  <Input
                    id="age_max"
                    type="number"
                    min={18}
                    max={99}
                    value={ageMax}
                    onChange={(e) => setAgeMax(Number(e.target.value) || 99)}
                    className="mt-1 bg-white border-neutral-200"
                  />
                </div>
              </div>
            </div>

            {/* Interests */}
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Interests</p>
              <p className="text-sm text-neutral-600 mb-3">Show people who have these interests</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_INTERESTS.map((interest) => (
                  <label
                    key={interest}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 cursor-pointer hover:bg-neutral-50 transition-colors has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-900 has-[:checked]:text-white"
                  >
                    <Checkbox
                      checked={showMeInterests.includes(interest)}
                      onCheckedChange={(checked) => {
                        if (checked === true) setShowMeInterests((prev) => [...prev, interest]);
                        else setShowMeInterests((prev) => prev.filter((i) => i !== interest));
                      }}
                    />
                    <span className="text-sm font-medium">{interest}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
        >
          {saving ? 'Saving…' : 'Save privacy settings'}
        </Button>
      </div>
    </div>
  );
}
