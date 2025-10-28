'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type LinkItem = {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
  collection?: string | null;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
};

function SortableLinkRow({
  item,
  onChange,
  onSave,
  onDelete
}: {
  item: LinkItem;
  onChange: (partial: Partial<LinkItem>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className="rounded border p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{item.title || 'Untitled'}</div>
        <button
          className="cursor-grab text-sm text-gray-600"
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
        >
          :::
        </button>
      </div>

      <div className="mt-3 grid md:grid-cols-2 gap-2">
        <input
          className="rounded border p-2"
          placeholder="Title"
          value={item.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <input
          className="rounded border p-2"
          placeholder="https://example.com"
          value={item.url}
          onChange={(e) => onChange({ url: e.target.value })}
        />
        <input
          className="rounded border p-2"
          placeholder="Collection (optional)"
          value={item.collection ?? ''}
          onChange={(e) => onChange({ collection: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded border p-2"
            type="datetime-local"
            value={item.visibleFrom ?? ''}
            onChange={(e) => onChange({ visibleFrom: e.target.value })}
          />
          <input
            className="rounded border p-2"
            type="datetime-local"
            value={item.visibleUntil ?? ''}
            onChange={(e) => onChange({ visibleUntil: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.active}
            onChange={(e) => onChange({ active: e.target.checked })}
          />
          Active
        </label>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-1" onClick={onSave}>Save</button>
          <button className="rounded border px-3 py-1 text-red-600" onClick={onDelete}>Delete</button>
        </div>
      </div>
    </li>
  );
}

export default function LinksPage() {
  const { status } = useSession();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [collection, setCollection] = useState('');
  const [visibleFrom, setVisibleFrom] = useState('');
  const [visibleUntil, setVisibleUntil] = useState('');

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
      body: JSON.stringify({
        title,
        url,
        collection: collection || undefined,
        visibleFrom: visibleFrom || undefined,
        visibleUntil: visibleUntil || undefined
      }),
    });
    if (res.ok) {
      const newLink = await res.json();
      setLinks((prev) => [...prev, newLink]);
      setTitle('');
      setUrl('');
      setCollection('');
      setVisibleFrom('');
      setVisibleUntil('');
    } else {
      alert('Failed to add link');
    }
  };

  const ids = useMemo(() => links.map((l) => l.id), [links]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const newOrder = arrayMove(links, oldIndex, newIndex).map((l, idx) => ({ ...l, order: idx }));

    setLinks(newOrder);

    // Persist order
    const res = await fetch('/api/links/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: newOrder.map((l) => ({ id: l.id, order: l.order })) }),
    });
    if (!res.ok) {
      alert('Failed to reorder');
    }
  };

  const saveLink = async (id: string, partial: Partial<LinkItem>) => {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const updated = await res.json();
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
    } else {
      alert('Failed to save link');
    }
  };

  const deleteLink = async (id: string) => {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } else {
      alert('Failed to delete link');
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

      <div className="mt-6 grid md:grid-cols-2 gap-2">
        <input
          className="rounded border p-2"
          placeholder="Link title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="rounded border p-2"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="rounded border p-2"
          placeholder="Collection (optional)"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded border p-2"
            type="datetime-local"
            value={visibleFrom}
            onChange={(e) => setVisibleFrom(e.target.value)}
          />
          <input
            className="rounded border p-2"
            type="datetime-local"
            value={visibleUntil}
            onChange={(e) => setVisibleUntil(e.target.value)}
          />
        </div>
        <button className="rounded bg-primary px-4 py-2 text-white" onClick={addLink}>
          Add
        </button>
      </div>

      <div className="mt-6">
        <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {links.map((item, idx) => (
                <SortableLinkRow
                  key={item.id}
                  item={item}
                  onChange={(partial) =>
                    setLinks((prev) =>
                      prev.map((l) => (l.id === item.id ? { ...l, ...partial } : l))
                    )
                  }
                  onSave={() => saveLink(item.id, item)}
                  onDelete={() => deleteLink(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </main>
  );
}