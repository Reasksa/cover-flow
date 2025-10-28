'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate NextAuth signIn
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

      <p className="mt-4 text-sm">
        No account? <Link className="underline" href="/register">Register</Link>
      </p>
    </main>
  );
}