import { Network } from '@/types/network';
import { deleteNetwork } from '@/lib/api/network';

type Props = {
  networks: Network[];
  onEdit: (network: Network) => void;
  onRefresh: () => void;
};

export default function NetworkTable({ networks, onEdit, onRefresh }: Props) {
  const handleDelete = async (id: string) => {
    if (confirm('Yakin hapus network ini?')) {
      await deleteNetwork(id);
      onRefresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Name</th>
            <th className="border px-2 py-1 text-left">Logo</th>
            <th className="border px-2 py-1 text-left">Coin Count</th>
            <th className="border px-2 py-1 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {networks.map((n) => (
            <tr key={n.id}>
              <td className="border px-2 py-1">{n.name}</td>
              <td className="border px-2 py-1">
                {n.logoUrl ? (
                  <img
                    src={n.logoUrl}
                    alt={n.name}
                    className="w-8 h-8 object-contain inline-block"
                  />
                ) : (
                  '-'
                )}
              </td>
              <td className="border px-2 py-1">{n.coins.length}</td>
              <td className="border px-2 py-1 space-x-2">
                <button onClick={() => onEdit(n)} className="text-blue-600 underline text-xs">Edit</button>
                <button onClick={() => handleDelete(n.id)} className="text-red-600 underline text-xs">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}