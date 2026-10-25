"""
tools.py — Semua logika deterministik ada di sini.

Prinsip: LLM tidak pernah melakukan perhitungan. LLM hanya memutuskan tool
mana yang dipakai dan membaca hasilnya. Semua angka di file ini dihasilkan
oleh Python murni, bisa diuji, dan hasilnya selalu bisa direproduksi.
"""

import ast
import csv
import json
import operator
import os
import re


# ---------------------------------------------------------------------------
# Tool 1 — Calculator
# ---------------------------------------------------------------------------

class CalculatorError(Exception):
    """Dilempar jika ekspresi matematika tidak valid atau tidak aman."""


# Hanya operator ini yang diizinkan. Tidak ada akses ke fungsi, atribut,
# nama variabel, import, atau apa pun selain angka dan operator aritmatika.
# Ini sengaja dibuat sebagai whitelist, bukan blacklist, seperti eval().
_ALLOWED_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval_node(node: ast.AST):
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
            return node.value
        raise CalculatorError(f"Nilai tidak valid dalam ekspresi: {node.value!r}")

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_OPERATORS:
            raise CalculatorError(f"Operator tidak didukung: {op_type.__name__}")
        left = _eval_node(node.left)
        right = _eval_node(node.right)
        try:
            return _ALLOWED_OPERATORS[op_type](left, right)
        except ZeroDivisionError:
            raise CalculatorError("Tidak bisa membagi dengan nol")

    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in _ALLOWED_OPERATORS:
            raise CalculatorError(f"Operator tidak didukung: {op_type.__name__}")
        return _ALLOWED_OPERATORS[op_type](_eval_node(node.operand))

    # Apa pun selain angka dan operator di atas (nama fungsi, atribut,
    # subscript, dsb) ditolak di sini. Ini yang membuat pendekatan ini
    # jauh lebih aman dibanding eval() langsung pada input user.
    raise CalculatorError(f"Bagian ekspresi tidak diperbolehkan: {type(node).__name__}")


def calculate(expression: str) -> float:
    """
    Menghitung ekspresi matematika sederhana secara aman.

    Mendukung: + - * / dan persentase (mis. "20%" otomatis jadi (20/100)).
    Tidak menggunakan eval() — ekspresi diparse jadi AST lalu dievaluasi
    node per node dengan whitelist operator di atas.
    """
    if not expression or not expression.strip():
        raise CalculatorError("Ekspresi kosong")

    # Ubah pola "angka%" jadi "(angka/100)" sebelum parsing,
    # misal "50 * 20%" -> "50 * (20/100)"
    normalized = re.sub(r"(\d+(\.\d+)?)\s*%", r"(\1/100)", expression.strip())

    try:
        tree = ast.parse(normalized, mode="eval")
    except SyntaxError:
        raise CalculatorError(f"Ekspresi matematika tidak valid: {expression!r}")

    return _eval_node(tree.body)


# ---------------------------------------------------------------------------
# Tool 2 — Sales Data Reader
# ---------------------------------------------------------------------------

class SalesDataError(Exception):
    """Dilempar jika data penjualan tidak ada, rusak, atau formatnya salah."""


_REQUIRED_FIELDS = {"product", "quantity", "price", "cost"}


def _to_number(raw: str):
    """Mengubah teks angka dari CSV/Excel jadi int atau float.

    Menangani format umum ekspor Excel, misal '8,000,000' atau '8.000.000'
    (pemisah ribuan) dengan cara membuang semua pemisah non-desimal.
    """
    text = raw.strip()
    if not text:
        raise ValueError("nilai angka kosong")

    # Buang pemisah ribuan (koma atau titik) yang bukan bagian dari desimal.
    # Heuristik sederhana: jika ada lebih dari satu titik/koma atau titik/koma
    # muncul tanpa 1-2 digit desimal di belakangnya, anggap itu pemisah ribuan.
    cleaned = text.replace(" ", "")
    if re.fullmatch(r"-?\d{1,3}(,\d{3})+", cleaned):
        cleaned = cleaned.replace(",", "")
    elif re.fullmatch(r"-?\d{1,3}(\.\d{3})+", cleaned):
        cleaned = cleaned.replace(".", "")

    if re.fullmatch(r"-?\d+", cleaned):
        return int(cleaned)
    if re.fullmatch(r"-?\d+\.\d+", cleaned):
        return float(cleaned)
    raise ValueError(f"format angka tidak dikenali: {raw!r}")


def _read_json_sales(path: str) -> list[dict]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise SalesDataError(f"File data penjualan rusak (JSON tidak valid): {e}")

    if not isinstance(data, list) or len(data) == 0:
        raise SalesDataError("Data penjualan kosong atau bukan berupa daftar produk")

    for i, item in enumerate(data):
        if not isinstance(item, dict) or not _REQUIRED_FIELDS.issubset(item.keys()):
            raise SalesDataError(
                f"Data pada baris {i + 1} tidak lengkap. "
                f"Kolom yang dibutuhkan: {sorted(_REQUIRED_FIELDS)}"
            )
    return data


def _detect_delimiter(header_line: str) -> str:
    """
    Menentukan delimiter CSV (',' atau ';') dari baris header saja.

    Header tidak pernah berisi nama produk, sehingga aman dari kasus seperti
    nama produk yang mengandung koma ('Tenex Lockers, Blue') atau tanda
    kutip literal (mis. ukuran dalam inci: 2"). csv.Sniffer() yang men-scan
    keseluruhan isi file justru bisa salah tebak pada kasus seperti itu.
    """
    semicolons = header_line.count(";")
    commas = header_line.count(",")
    return ";" if semicolons > commas else ","


def _read_csv_sales(path: str) -> list[dict]:
    with open(path, "r", newline="", encoding="utf-8-sig") as f:
        first_line = f.readline()
        if not first_line:
            raise SalesDataError("File CSV kosong")
        delimiter = _detect_delimiter(first_line)
        f.seek(0)

        reader = csv.DictReader(f, delimiter=delimiter)
        if not reader.fieldnames:
            raise SalesDataError("File CSV tidak memiliki baris header")

        # Cocokkan nama kolom tanpa peduli huruf besar/kecil atau spasi ekstra
        header_map = {name.strip().lower(): name for name in reader.fieldnames}
        missing = _REQUIRED_FIELDS - set(header_map.keys())
        if missing:
            raise SalesDataError(
                f"Kolom CSV kurang: {sorted(missing)}. "
                f"Kolom yang ditemukan: {reader.fieldnames}"
            )

        data = []
        for i, row in enumerate(reader):
            try:
                data.append({
                    "product": row[header_map["product"]].strip(),
                    "quantity": _to_number(row[header_map["quantity"]]),
                    "price": _to_number(row[header_map["price"]]),
                    "cost": _to_number(row[header_map["cost"]]),
                })
            except (ValueError, AttributeError) as e:
                raise SalesDataError(f"Baris {i + 2} pada CSV berisi nilai tidak valid: {e}")

    if not data:
        raise SalesDataError("File CSV tidak berisi data produk")
    return data


def read_sales_data(path: str) -> list[dict]:
    """
    Membaca dan memvalidasi data penjualan. Mendukung dua format:
    - .json  (format asli, lihat data/sales.json)
    - .csv   (mis. hasil export dari Excel: File > Save As > CSV)

    Kolom/field yang wajib ada: product, quantity, price, cost.
    """
    if not os.path.exists(path):
        raise SalesDataError(
            f"File data penjualan tidak ditemukan: {path}. "
            "Pastikan path di config.SALES_DATA_PATH sudah benar."
        )

    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        return _read_json_sales(path)
    if ext == ".csv":
        return _read_csv_sales(path)

    raise SalesDataError(
        f"Format file tidak didukung: '{ext}'. Gunakan file .json atau .csv"
    )


# ---------------------------------------------------------------------------
# Tool 3 — Business Analysis
# ---------------------------------------------------------------------------

def analyze_sales(data: list[dict]) -> dict:
    """
    Menghitung ringkasan bisnis dari data penjualan.

    Semua perhitungan murni Python (deterministik), tidak melibatkan LLM.
    """
    if not data:
        raise SalesDataError("Tidak ada data untuk dianalisis")

    total_revenue = 0.0
    total_cost = 0.0

    best_seller_name = None
    best_seller_qty = -1

    most_profitable_name = None
    most_profitable_value = float("-inf")

    for item in data:
        quantity = item["quantity"]
        price = item["price"]
        cost = item["cost"]

        revenue = quantity * price
        cost_total = quantity * cost
        profit = revenue - cost_total

        total_revenue += revenue
        total_cost += cost_total

        if quantity > best_seller_qty:
            best_seller_qty = quantity
            best_seller_name = item["product"]

        if profit > most_profitable_value:
            most_profitable_value = profit
            most_profitable_name = item["product"]

    total_profit = total_revenue - total_cost
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    return {
        "total_revenue": total_revenue,
        "total_cost": total_cost,
        "total_profit": total_profit,
        "profit_margin": round(profit_margin, 2),
        "best_seller_product": best_seller_name,
        "best_seller_quantity": best_seller_qty,
        "most_profitable_product": most_profitable_name,
        "most_profitable_value": most_profitable_value,
    }
