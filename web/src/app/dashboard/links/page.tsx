'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
};

export default function LinksPage() {
  const { status } = useSession();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/links')
        .then((r) => r.json())
        .then((data) => setLinks(data));
    }
  }, [status]);

  const addLink = async () => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, url }),
    });
    if (res.ok) {
      const newLink = await res.json();
      setLinks((prev) => [...prev, newLink]);
      setTitle('');
      setUrl('');
    } else {
      alert('Failed to add link');
    }
  };

  if (status === 'loading') {
    return <main className="p-6">Loading...</main>;
  }

  if (status !== 'authenticated') {
    return (
      <main className="p-6">
        <p>You need to sign in to manage links.</p>
        <button className="mt-3 rounded bg-primary px-4 py-2 text-white" onClick={() => signIn()}>
          Sign In
        </button>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Your Links</h1>

      <div className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          placeholder="Link title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="flex-1 rounded border p-2"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={addLink}>
          Add
        </button>
      </div>

      <ul className="mt-6 space-y-2">
        {links.map((l) => (
          <li key={l.id} className="rounded border p-3">
            <div className="font-semibold">{l.title}</div>
            <div className="text-sm text-gray-600">{l.url}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}