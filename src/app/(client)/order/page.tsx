export default function OrdersHomePage() {
  const sections = [
    { name: "Orders", href: "order/new" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">order Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <a
            key={sec.name}
            href={sec.href}
            className="block p-4 border rounded bg-white shadow hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">{sec.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Manage {sec.name}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
