'use client';

import { useEffect, useState } from 'react';

type Theme = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  font: string;
};

export default function AppearancePage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((data) => setThemes(data));
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
    }
  };

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
    </main>
  );
}