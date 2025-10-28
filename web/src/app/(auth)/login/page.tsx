'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard',
      redirect: true,
    });
  };

  const loginWithProvider = async (provider: 'google' | 'github') => {
    await signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <main className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-2xl font-bold">Login</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full rounded bg-primary p-2 text-white">Sign In</button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button className="rounded border px-4 py-2" onClick={() => loginWithProvider('google')}>
          Continue with Google
        </button>
        <button className="rounded border px-4 py-2" onClick={() => loginWithProvider('github')}>
          Continue with GitHub
        </button>
      </div>

      <p className="mt-4 text-sm">
        No account? <Link className="underline" href="/register">Register</Link>
      </p>
      <p className="mt-2 text-sm">
        <Link className="underline" href="/forgot">Forgot your password?</Link>
      </p>
    </main>
  );
}