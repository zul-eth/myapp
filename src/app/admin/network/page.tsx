'use client';
import { useEffect, useState } from 'react';
import { getNetworks } from '@/lib/api/network';
import { Network } from '@/types/network';
import NetworkForm from './NetworkForm';
import NetworkTable from './NetworkTable';

export default function NetworkAdminPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [editing, setEditing] = useState<Network | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const data = await getNetworks();
    setNetworks(data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Network Management</h1>
      <button
        onClick={() => {
          setEditing(null);
          setShowForm(true);
        }}
        className="mb-3 text-sm text-blue-600 underline"
      >
        + Tambah Network
      </button>

      {showForm && (
        <NetworkForm
          initialData={editing || undefined}
          onSuccess={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <NetworkTable
        networks={networks}
        onEdit={(n) => {
          setEditing(n);
          setShowForm(true);
        }}
        onRefresh={load}
      />
    </div>
  );
}