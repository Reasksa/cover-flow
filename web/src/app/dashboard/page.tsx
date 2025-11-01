'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardHome() {
  const { status } = useSession();

  if (status === 'loading') {
    return <main className="p-6">Loading...</main>;
  }

  if (status !== 'authenticated') {
    return (
      <main className="p-6">
        <p>You need to sign in to access the dashboard.</p>
        <button className="mt-3 rounded bg-primary px-4 py-2 text-white" onClick={() => signIn()}>
          Sign In
        </button>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4">
        <Link href="/dashboard/links" className="underline">Manage Links</Link>
      </div>
    </main>
  );
}