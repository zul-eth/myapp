import Sidebar from "@/components/admin/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <header className="sticky top-0 z-10 bg-white border-b">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <h1 className="text-lg font-semibold">Admin Panel</h1>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
