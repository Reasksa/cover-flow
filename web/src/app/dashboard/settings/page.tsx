'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const saveAvatar = async () => {
    setSaving(true);
    const res = await fetch('/api/me/avatar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl }),
    });
    setSaving(false);
    if (!res.ok) {
      alert('Failed to update avatar');
    } else {
      setAvatarUrl('');
      alert('Avatar updated');
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-6 grid md:grid-cols-2 gap-2">
        <input
          className="rounded border p-2"
          placeholder="Avatar image URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={saveAvatar} disabled={saving}>
          {saving ? 'Saving...' : 'Save Avatar'}
        </button>
      </div>
      <p className="mt-2 text-gray-600 text-sm">Tip: Host images on Cloudinary and paste the URL here.</p>
    </main>
  );
}