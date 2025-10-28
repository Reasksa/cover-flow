'use client';

import { useSearchParams } from 'next/navigation';

export default function BillingPage() {
  const params = useSearchParams();
  const success = params.get('success');
  const canceled = params.get('canceled');

  const upgrade = async () => {
    const res = await fetch('/api/billing/subscribe', { method: 'POST' });
    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to start checkout');
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      {success && <p className="mt-2 text-green-700">Subscription activated.</p>}
      {canceled && <p className="mt-2 text-yellow-700">Checkout canceled.</p>}
      <div className="mt-6">
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={upgrade}>Upgrade to Pro</button>
      </div>
      <p className="mt-2 text-gray-600">Pro unlocks advanced analytics, themes, and integrations.</p>
    </main>
  );
}