export default function PricingPage() {
  const plans = [
    { name: 'Free', price: '$0', features: ['Basic profile', 'Unlimited links'] },
    { name: 'Pro', price: '$9/mo', features: ['Themes', 'Analytics', 'Embeds'] },
    { name: 'Business', price: '$29/mo', features: ['Team features', 'Advanced analytics', 'Priority support'] },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.name} className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="mt-2 text-2xl">{p.price}</p>
            <ul className="mt-4 space-y-2 text-gray-600">
              {p.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button className="mt-6 w-full rounded bg-primary p-2 text-white">Choose {p.name}</button>
          </div>
        ))}
      </div>
    </main>
  );
}