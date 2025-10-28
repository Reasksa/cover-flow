'use client';

import { useEffect, useState } from 'react';
import ProfilePreview from '@/src/components/ProfilePreview';

type Theme = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  font: string;
};

type Me = {
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  links: { id: string; title: string; url: string; active: boolean }[];
  theme?: { primary: string; background: string } | null;
};

export default function AppearancePage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch('/api/themes').then((r) => r.json()).then(setThemes);
    fetch('/api/me').then((r) => r.json()).then((data) => setMe(data));
  }, []);

  const applyTheme = async () => {
    if (!selectedThemeId) return;
    setSaving(true);
    const res = await fetch('/api/me/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: selectedThemeId })
    });
    setSaving(false);
    if (!res.ok) {
      alert('Failed to apply theme');
      return;
    }
    // Refresh me data to reflect the new theme in preview
    const refreshed = await fetch('/api/me').then((r) => r.json());
    setMe(refreshed);
  };

  const activeTheme = selectedThemeId
    ? themes.find((t) => t.id === selectedThemeId)
    : me?.theme
      ? { primary: me.theme.primary, secondary: '', background: me.theme.background, font: 'Inter', id: '', name: '' } as any
      : undefined;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Appearance</h1>
      <p className="mt-2 text-gray-600">Choose a theme. Your public profile updates instantly.</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {themes.map((t) => (
          <button
            key={t.id}
            className={`rounded-lg border p-4 text-left hover:shadow ${selectedThemeId === t.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedThemeId(t.id)}
          >
            <div
              className="h-16 rounded"
              style={{ background: t.background }}
            />
            <div className="mt-2 font-semibold">{t.name}</div>
            <div className="text-sm text-gray-600">Primary: {t.primary}</div>
          </button>
        ))}
      </div>

      <button
        className="mt-6 rounded bg-primary px-4 py-2 text-white"
        onClick={applyTheme}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Apply Theme'}
      </button>

      <div className="mt-8">
        <h2 className="font-semibold mb-2">Live preview</h2>
        {me && activeTheme ? (
          <ProfilePreview
            username={me.username}
            name={me.name}
            bio={me.bio}
            avatar={me.avatar}
            links={me.links}
            theme={{ primary: activeTheme.primary, background: activeTheme.background }}
          />
        ) : (
          <p className="text-gray-600">Loading preview…</p>
        )}
      </div>
    </main>
  );
}