import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Camera, Eye, EyeOff } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { DatePicker } from '@/app/components/ui/date-picker';
import { CountryCodeSelect } from '@/app/components/ui/country-code-select';
import { Card, CardContent } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Switch } from '@/app/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { COUNTRY_OPTIONS } from '@/app/data/countries';
import {
  OnboardingPayload,
  OnboardingSocialNetworks,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_COMPLETE_KEY,
} from '@/app/types/onboarding';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/lib/auth';
import { cn } from '@/app/components/ui/utils';
import { toast } from 'sonner';

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

const STEPS = [
  { title: 'Account', fields: ['email', 'password', 'confirmPassword'] as const },
  { title: 'Basics', fields: ['fullName', 'dateOfBirth', 'interests'] as const },
  { title: 'Contact', fields: ['countryCode', 'phone', 'messenger'] as const },
  { title: 'Social', fields: ['socialNetworks'] as const },
  { title: 'Profile', fields: ['profilePhoto', 'bio'] as const },
  { title: 'Location', fields: ['locationEnabled'] as const },
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

type FormValues = Omit<OnboardingPayload, 'profilePhoto'> & {
  confirmPassword: string;
  dateOfBirth: Date | undefined;
  profilePhoto: FileList | null;
  countryCode: string;
};

const defaultSocial: OnboardingSocialNetworks = {};

function getPayload(values: FormValues): OnboardingPayload {
  const profilePhotoUrl =
    values.profilePhoto?.[0]
      ? URL.createObjectURL(values.profilePhoto[0])
      : null;
  const country = COUNTRY_OPTIONS.find((c) => c.value === values.countryCode);
  const fullPhone = (country?.dialCode ?? '') + (values.phone?.trim() ?? '');
  return {
    email: values.email ?? '',
    password: values.password ?? '',
    fullName: values.fullName,
    dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : '',
    interests: values.interests ?? [],
    phone: fullPhone,
    messenger: values.messenger,
    socialNetworks: values.socialNetworks ?? defaultSocial,
    profilePhoto: profilePhotoUrl,
    bio: values.bio ?? '',
    locationEnabled: values.locationEnabled,
    coords: values.coords,
  };
}

export function SignUpFlow() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      dateOfBirth: undefined,
      interests: [],
      countryCode: 'NG',
      phone: '',
      messenger: [],
      socialNetworks: defaultSocial,
      profilePhoto: null,
      bio: '',
      locationEnabled: false,
      coords: undefined,
    },
  });

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const validateStep = async (): Promise<boolean> => {
    if (!currentStep) return true;
    const valid = await form.trigger([...currentStep.fields]);
    return valid;
  };

  const handleNext = async () => {
    const ok = await validateStep();
    if (!ok) return;
    if (isLastStep) {
      const values = form.getValues();
      const payload = getPayload(values);

      if (supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
        });
        if (authError) {
          toast.error(authError.message ?? 'Sign up failed');
          return;
        }
        const user = authData?.user;
        if (!user) {
          toast.success('Account created. Please check your email to confirm.');
          navigate('/signin');
          return;
        }

        let avatarUrl: string | null = null;
        const photoFile = values.profilePhoto?.[0];
        if (photoFile) {
          const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase();
          const path = `${user.id}/avatar.${ext === 'png' ? 'png' : 'jpg'}`;
          const contentType = photoFile.type?.startsWith('image/') ? photoFile.type : 'image/jpeg';
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, photoFile, { upsert: true, contentType });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            avatarUrl = urlData?.publicUrl ?? null;
          }
        }

        const dateOnly = payload.dateOfBirth
          ? payload.dateOfBirth.slice(0, 10)
          : null;

        const profileRow = {
          id: user.id,
          full_name: payload.fullName.trim(),
          date_of_birth: dateOnly,
          interests: payload.interests?.length ? payload.interests : [],
          phone: payload.phone?.trim() || null,
          messenger: Array.isArray(payload.messenger) && payload.messenger.length > 0 ? payload.messenger : [],
          social_networks: payload.socialNetworks && Object.keys(payload.socialNetworks).length
            ? payload.socialNetworks
            : {},
          avatar_url: avatarUrl,
          bio: payload.bio?.trim() || null,
          location_enabled: payload.locationEnabled ?? false,
          lat: payload.coords?.lat ?? null,
          lng: payload.coords?.lng ?? null,
          city: null,
        };
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileRow, { onConflict: 'id' });
        if (profileError) {
          toast.error(profileError.message ?? 'Could not save profile');
          return;
        }
        await refreshProfile();
        toast.success('Account created');
        setTimeout(() => navigate('/feed'), 0);
        return;
      }

      try {
        const toStore = { ...payload, profilePhoto: null };
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(toStore));
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      } catch (_) {}
      navigate('/feed');
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleLocationToggle = (enabled: boolean) => {
    form.setValue('locationEnabled', enabled);
    if (enabled) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          form.setValue('coords', {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          form.setValue('locationEnabled', false);
        }
      );
    } else {
      form.setValue('coords', undefined);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-8 pb-24">
      <Card className="w-full max-w-md rounded-[5px] border-neutral-200 bg-white shadow-md">
        <CardContent className="p-6 sm:p-8">
          <div className="flex justify-center gap-1.5 mb-6" aria-label="Progress">
            {STEPS.map((_, i) => (
              <div
                key={i}
                aria-current={step === i ? 'step' : undefined}
                className={cn(
                  'h-1.5 rounded-full w-8 transition-colors',
                  i <= step ? 'bg-neutral-900' : 'bg-neutral-200'
                )}
              />
            ))}
          </div>
          <p className="text-center text-sm text-neutral-500 mb-6">
            Step {step + 1} of {STEPS.length}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
            {step === 0 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Enter a valid email',
                    },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="bg-white border-neutral-200"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    required: 'Create a password',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="bg-white border-neutral-200 pr-10"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  rules={{
                    required: 'Confirm your password',
                    validate: (value) =>
                      value === form.getValues('password') || 'Passwords do not match',
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="bg-white border-neutral-200 pr-10"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  rules={{ required: 'Full name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your full name"
                          className="bg-white border-neutral-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  rules={{ required: 'Date of birth is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of birth</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          disabled={(date) => date > new Date()}
                          placeholder="Pick a date"
                          className="w-full justify-start text-left font-normal h-11 rounded-xl bg-white border-neutral-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interests"
                  rules={{
                    validate: (v) =>
                      (v && v.length > 0) || 'Select at least one interest',
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <div className="flex flex-wrap gap-3">
                        {PRESET_INTERESTS.map((interest) => (
                          <div
                            key={interest}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`interest-${interest}`}
                              checked={field.value?.includes(interest)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...(field.value ?? []), interest]
                                  : (field.value ?? []).filter(
                                      (x) => x !== interest
                                    );
                                field.onChange(next);
                              }}
                            />
                            <label
                              htmlFor={`interest-${interest}`}
                              className="text-sm font-normal cursor-pointer leading-none"
                            >
                              {interest}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone number</Label>
                  <div className="flex rounded-xl border border-neutral-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-neutral-300 focus-within:ring-offset-2">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem className="shrink-0">
                          <FormControl>
                            <CountryCodeSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={COUNTRY_OPTIONS}
                              placeholder="Country"
                              triggerClassName="rounded-none border-0 border-r border-neutral-200 h-11 rounded-l-xl min-w-[5.5rem]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      rules={{ required: 'Phone number is required' }}
                      render={({ field }) => (
                        <FormItem className="flex-1 min-w-0">
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="XXX XXX XXXX"
                              className="bg-white border-0 rounded-none rounded-r-xl font-mono h-11 flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="messenger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Messengers</FormLabel>
                      <p className="text-sm text-neutral-500 mb-2">
                        Select all the messengers your number is available on.
                      </p>
                      <FormControl>
                        <div className="flex flex-wrap gap-3">
                          {MESSENGER_OPTIONS.map((opt) => (
                            <div
                              key={opt.value}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`messenger-${opt.value}`}
                                checked={field.value?.includes(opt.value)}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? [...(field.value ?? []), opt.value]
                                    : (field.value ?? []).filter((x) => x !== opt.value);
                                  field.onChange(next);
                                }}
                              />
                              <label
                                htmlFor={`messenger-${opt.value}`}
                                className="text-sm font-normal cursor-pointer leading-none"
                              >
                                {opt.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <FormLabel>Social networks</FormLabel>
                {(['instagram', 'facebook', 'twitter', 'linkedin'] as const).map(
                  (key) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={`socialNetworks.${key}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize font-normal">
                            {key === 'twitter' ? 'X (Twitter)' : key}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="@handle or URL"
                              className="bg-white border-neutral-200"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value || undefined)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="profilePhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile photo</FormLabel>
                      <div className="flex items-center gap-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            field.onChange(e.target.files)
                          }
                        />
                        <Avatar
                          className="h-24 w-24 cursor-pointer border-2 border-neutral-200"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {field.value?.[0] ? (
                            <AvatarImage
                              src={URL.createObjectURL(field.value[0])}
                              alt="Preview"
                            />
                          ) : null}
                          <AvatarFallback className="bg-neutral-200 text-neutral-500">
                            <Camera className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-neutral-200"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Add photo
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short bio about you"
                          className="bg-white border-neutral-200 min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Enable location to find people near you. We use your location only to show nearby contacts and posts.
                </p>
                <FormField
                  control={form.control}
                  name="locationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
                      <FormLabel className="font-normal">Enable location</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            handleLocationToggle(checked);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-neutral-200"
                onClick={handleBack}
                disabled={step === 0}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1 bg-neutral-900 hover:bg-neutral-800">
                {isLastStep ? 'Complete' : 'Next'}
              </Button>
            </div>
          </form>
        </Form>
        </CardContent>
      </Card>
      <p className="text-center text-sm text-neutral-500 mt-6">
        Already have an account?{' '}
        <Link to="/signin" className="font-medium text-neutral-900 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
