'use client';
import { useState } from 'react';
import { Coin } from '@/types/coin';
import { createCoin, updateCoin } from '@/lib/api/coin';

type Props = {
  initialData?: Coin;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function CoinForm({ initialData, onSuccess, onCancel }: Props) {
  const [symbol, setSymbol] = useState(initialData?.symbol || '');
  const [name, setName] = useState(initialData?.name || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || '');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let uploadedLogoUrl = logoUrl;

    // Upload file jika user memilih file baru
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        uploadedLogoUrl = data.url;
      } catch (err) {
        console.error('Gagal upload logo', err);
        setLoading(false);
        return;
      }
    }

    const payload = {
      symbol,
      name,
      logoUrl: uploadedLogoUrl,
    };

    try {
      if (initialData) {
        await updateCoin(initialData.id, payload);
      } else {
        await createCoin(payload);
      }
      onSuccess?.();
    } catch (e) {
      console.error('Gagal simpan coin', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border p-4 mb-4 bg-gray-50 space-y-3">
      <div>
        <label className="block text-sm font-medium">Symbol</label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border w-full p-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border w-full p-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Logo (Upload File)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
      </div>
      {logoUrl && !file && (
        <div className="mt-1">
          <img src={logoUrl} alt="Preview" className="h-10" />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          {loading ? 'Menyimpan...' : 'Simpan'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-black px-3 py-1 rounded"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}