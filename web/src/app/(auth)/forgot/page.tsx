'use client';

import { useState } from 'react';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) setSent(true);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      {sent ? (
        <p className="mt-4 text-green-700">If the email exists, a reset link has been sent.</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded border p-2"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="w-full rounded bg-primary p-2 text-white">Send reset link</button>
        </form>
      )}
    </main>
  );
}