'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <section className="text-center">
        <motion.h1
          className="text-4xl md:text-6xl font-bold"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          All Your Links. One Place.
        </motion.h1>
        <p className="mt-6 text-lg text-gray-600">
          Create a beautiful link-in-bio profile with themes, analytics, and integrations.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-primary px-6 py-3 text-white hover:scale-105 hover:shadow-lg transition"
          >
            Get Started
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-6 py-3 hover:scale-105 hover:shadow-lg transition"
          >
            Pricing
          </Link>
        </div>
      </section>

      <section className="mt-20 grid md:grid-cols-3 gap-6">
        {[
          { title: 'Analytics', desc: 'Track clicks, views, and referrers with charts and exports.' },
          { title: 'Customization', desc: 'Pick themes, colors, fonts, and layout. Dark mode included.' },
          { title: 'Integrations', desc: 'Connect social profiles, embed YouTube, Spotify, and more.' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border p-6 hover:shadow-lg transition">
            <h3 className="text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-gray-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}