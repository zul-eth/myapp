'use client';
import { useState } from 'react';
import { createNetwork, updateNetwork } from '@/lib/api/network';
import { Network } from '@/types/network';

type Props = {
  initialData?: Network;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function NetworkForm({ initialData, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, logoUrl };
    try {
      if (initialData) {
        await updateNetwork(initialData.id, payload);
      } else {
        await createNetwork(payload);
      }
      onSuccess?.();
    } catch (e) {
      console.error('Gagal simpan network', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 mb-4 bg-gray-50">
      <div className="mb-2">
        <label className="block text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full p-1"
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm">Logo URL</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="border w-full p-1"
        />
      </div>
      <div className="flex space-x-2 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-black px-3 py-1"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}