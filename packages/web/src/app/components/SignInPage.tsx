import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/app/lib/auth';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type SignInForm = { email: string; password?: string };

export function SignInPage() {
  const { session, signInWithEmail, signInWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  const form = useForm<SignInForm>({
    defaultValues: { email: '', password: '' },
  });

  async function onSubmitMagicLink(values: SignInForm) {
    setLoading(true);
    const { error } = await signInWithEmail(values.email);
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Failed to send link');
      return;
    }
    setSent(true);
    toast.success('Check your email for the sign-in link');
  }

  async function onSubmitPassword(values: SignInForm) {
    if (!values.password?.trim()) {
      toast.error('Password is required');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPassword(values.email, values.password);
    setLoading(false);
    if (error) {
      toast.error(error.message ?? 'Sign in failed');
      return;
    }
    toast.success('Signed in');
  }

  if (session) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
          <p className="mt-2 text-neutral-600 text-sm">
            {sent
              ? 'We sent you a link. Click it to sign in.'
              : usePassword
                ? 'Enter your email and password.'
                : "Enter your email and we'll send you a sign-in link."}
          </p>
        </div>

        {sent ? (
          <p className="text-center text-sm text-neutral-600">
            Check <strong>{form.getValues('email')}</strong> and click the link in the email.
          </p>
        ) : usePassword ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPassword)} className="space-y-4">
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
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-white border-neutral-200"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <button
                type="button"
                onClick={() => setUsePassword(false)}
                className="w-full text-sm text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                Use magic link instead
              </button>
            </form>
          </Form>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitMagicLink)} className="space-y-4">
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
              <Button
                type="submit"
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800"
                disabled={loading}
              >
                {loading ? 'Sending link…' : 'Send sign-in link'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-neutral-200"
                onClick={() => setUsePassword(true)}
              >
                Use password
              </Button>
            </form>
          </Form>
        )}

        <p className="text-center text-sm text-neutral-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-neutral-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
