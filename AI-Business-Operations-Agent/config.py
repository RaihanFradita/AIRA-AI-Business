"""
Konfigurasi terpusat AI Business Agent.

Semua nilai yang mungkin perlu diubah (model, alamat Ollama, path data)
diletakkan di sini. File lain (agent.py, tools.py, main.py) hanya
membaca nilai dari sini, tidak pernah hard-code nilai serupa.
"""

# Nama model Ollama yang dipakai. Ganti baris ini saja untuk berganti model,
# misalnya "llama3.1:8b" atau "qwen2.5:7b" — tidak perlu ubah file lain.
MODEL = "gemma3:4b"

# Alamat server Ollama. Default ini sesuai instalasi lokal standar.
OLLAMA_HOST = "http://localhost:11434"

# Batas waktu tunggu respons dari Ollama, dalam detik.
# Model kecil di CPU bisa lambat, jadi diberi ruang cukup.
REQUEST_TIMEOUT = 120

# Lokasi file data penjualan.
SALES_DATA_PATH = "data/sales_by_product.csv" 
