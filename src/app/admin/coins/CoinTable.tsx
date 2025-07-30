'use client';

import { Coin } from '@/types/coin';
import { deleteCoin } from '@/lib/api/coin';

type Props = {
  coins: Coin[];
  onEdit: (coin: Coin) => void;
  onRefresh: () => void;
};

export default function CoinTable({ coins, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    if (confirm('Yakin hapus coin ini?')) {
      try {
        await deleteCoin(id);
        await onRefresh();
      } catch (err: any) {
        alert('Gagal hapus: ' + err.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 overflow-x-auto bg-white border border-gray-300 rounded-md shadow-sm">
      <table className="w-full text-sm table-auto border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Symbol</th>
            <th className="border px-3 py-2 text-left">Name</th>
            <th className="border px-3 py-2 text-center">Logo</th>
            <th className="border px-3 py-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{coin.symbol}</td>
              <td className="border px-3 py-2">{coin.name}</td>
              <td className="border px-3 py-2 text-center align-middle">
                {coin.logoUrl ? (
                  <div className="flex justify-center items-center h-10">
                    <img
                      src={coin.logoUrl}
                      alt={coin.symbol}
                      className="max-w-[32px] max-h-[32px] object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
              
              
              <td className="border px-3 py-2 text-center space-x-2">
                <button
                  onClick={() => onEdit(coin)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(coin.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {coins.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-gray-400 py-4">
                Belum ada coin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}