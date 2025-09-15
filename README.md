



## Getting Started
# Roadmap
- API logic  (CRUD & relasi) ✅
- Unit/Integration Testing ✅
- Integrasi UI/UX
- Auth & middleware
- Deployment
- Monitoring
- Webhook/Notifikasi

flowchart TD status
    PENDING -->|Pembayaran diterima| PAID
    PAID -->|Verifikasi berhasil| PROCESSING
    PROCESSING -->|Transaksi selesai| COMPLETED
    PROCESSING -->|Gagal kirim| FAILED
    PENDING -->|Timeout / dibatalkan admin| CANCELLED

## Daftar API RESTful

Entity Method Endpoint Fungsi

# Coin 
- GET /api/coins List semua coin aktif
- POST /api/coins Tambah coin baru
- PUT /api/coins/:id Update nama/symbol/logo/isActive coin
- DELETE /api/coins/:id Hapus coin

# Network 
- GET /api/networks List semua network aktif
- POST /api/networks Tambah network baru
- PUT /api/networks/:id Update nama/logo/isActive network
- DELETE /api/networks/:id Hapus network

# CoinNetwork 
- GET api/coin-network Lihat semua coin-network relasi
- POST api/coin-network Hubungkan coin ↔ network
- PUT api/coin-network/:id Aktif/nonaktifkan koneksi
- DELETE api/coin-network/:id Hapus relasi coin ↔ network

# PaymentOption
- GET /api/payment-options List kombinasi coin + network aktif untuk pembayaran
- POST /api/payment-options Tambah kombinasi payment baru
- PUT /api/payment-options/:id Update status aktif/tidaknya metode pembayaran
- DELETE /api/payment-options/:id Hapus metode pembayaran

# Rates 
- GET api/coin-network mengembalikan array rate lengkap beserta relasi buyCoin, buyNetwork,   payCoin, payNetwork.
- POST api/coin-network menerima { buyCoinId, buyNetworkId, payCoinId, payNetworkId, rate }.
- PUT api/coin-network/:id menerima { rate? , isActive? } dan return objek rate terbaru
- DELETE api/coin-network/:id menghapus entri.

# Order
- GET /api/orders/:id Lihat detail order tertentu
- POST /api/order Buat order baru
- PUT /api/orders/:id/status Update status (misalnya: CONFIRMED, COMPLETED)
- GET /api/orders List semua order (opsional untuk admin)

# WalletPool
- GET /api/wallet-pool List semua wallet
- POST /api/wallet-pool Tambah wallet baru
- PUT /api/wallet-pool/:id Tandai sebagai used/un-used
- DELETE /api/wallet-pool/:id Hapus wallet dari pool


# payment metod
- evm  native & erc20 (eth, base, op, arb ,pol, bnb | usdt,usdc,dai)
- tron, solana, eos, xrp, doge, sui, ltc, ton