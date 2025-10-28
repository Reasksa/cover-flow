'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const uploadAvatar = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    const sigRes = await fetch('/api/uploads/signature');
    const sig = await sigRes.json();
    if (!sig?.signature) {
      setUploading(false);
      alert('Upload signature error');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.apiKey);
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', sig.signature);
    formData.append('upload_preset', ''); // optional if you use presets

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const uploaded = await uploadRes.json();
    setUploading(false);
    if (uploaded?.secure_url) {
      setAvatarUrl(uploaded.secure_url);
    } else {
      alert('Upload failed');
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
      <div className="mt-4">
        <input
          className="rounded border p-2"
          type="file"
          accept="image/*"
          onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)}
        />
        {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
      </div>
      <p className="mt-2 text-gray-600 text-sm">Tip: Upload to Cloudinary or paste a hosted image URL above.</p>
    </main>
  );
}