'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // token is read from query; display simple UI
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) setDone(true);
  };

  return (
    <main className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-2xl font-bold">Reset password</h1>
      {done ? (
        <p className="mt-4 text-green-700">Password updated. You can now login.</p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <input
            className="w-full rounded border p-2"
            type="password"
            placeholder="New secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full rounded bg-primary p-2 text-white">Update password</button>
        </form>
      )}
    </main>
  );
}