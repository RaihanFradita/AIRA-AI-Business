"""
agent.py — Menjembatani permintaan user, Ollama (local LLM), dan tools.py.

Alur untuk setiap permintaan user:
    1. decide_tool()   -> LLM memilih tool mana yang dibutuhkan (JSON ketat)
    2. execute_tool()  -> Python menjalankan tool tersebut (deterministik)
    3. format_result()  -> Python memformat hasil jadi teks rapi (TANPA LLM)

Kenapa langkah 3 tidak lagi memakai LLM?
Versi awal sempat meminta LLM "menjelaskan" hasil tool dalam bahasa natural.
Dalam pengujian nyata, model kecil (4B) terbukti kadang salah menyalin ulang
angka yang sudah benar dari tool (mis. Rp95.500.000 tertulis ulang jadi
Rp955.000.000) — meski sudah diinstruksikan keras untuk tidak mengarang.
Karena akurasi angka bisnis tidak boleh berisiko sedikit pun, langkah ini
diganti jadi formatting Python murni. LLM tetap dipakai untuk memutuskan
tool (langkah 1) dan untuk balasan obrolan biasa yang tidak melibatkan
angka hasil hitung (tool "none").
"""

import json
import re

import requests

import config
import tools


class AgentError(Exception):
    """Error pada level agent: koneksi Ollama, model, atau parsing tool call."""


# ---------------------------------------------------------------------------
# Koneksi ke Ollama
# ---------------------------------------------------------------------------

def _call_ollama(prompt: str, system: str) -> str:
    """Mengirim satu prompt ke Ollama dan mengembalikan teks respons mentah."""
    payload = {
        "model": config.MODEL,
        "prompt": prompt,
        "system": system,
        "stream": False,
        # temperature rendah supaya format JSON konsisten, bukan kreatif
        "options": {"temperature": 0.2},
    }

    try:
        response = requests.post(
            f"{config.OLLAMA_HOST}/api/generate",
            json=payload,
            timeout=config.REQUEST_TIMEOUT,
        )
    except requests.exceptions.ConnectionError:
        raise AgentError(
            "Tidak dapat terhubung ke Ollama.\n"
            "  Pastikan Ollama sudah berjalan, jalankan di terminal lain: ollama serve"
        )
    except requests.exceptions.Timeout:
        raise AgentError("Ollama tidak merespons dalam waktu yang wajar (timeout).")

    if response.status_code == 404:
        raise AgentError(
            f"Model '{config.MODEL}' tidak ditemukan di Ollama.\n"
            f"  Unduh dulu dengan: ollama pull {config.MODEL}"
        )
    if response.status_code != 200:
        raise AgentError(
            f"Ollama mengembalikan error (HTTP {response.status_code}): {response.text[:200]}"
        )

    try:
        data = response.json()
    except json.JSONDecodeError:
        raise AgentError("Respons dari Ollama bukan JSON yang valid.")

    return data.get("response", "")


def _extract_json(text: str) -> dict:
    """
    Mengambil objek JSON dari teks respons model.

    Model kecil kadang menambahkan teks lain di luar JSON meski sudah
    diinstruksikan tidak boleh. Sebagai jaring pengaman, kita coba parse
    langsung dulu, lalu kalau gagal cari blok {...} pertama dalam teks.
    """
    text = text.strip()
    # Beberapa model membungkus JSON dengan ```json ... ```
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise AgentError(f"Model menghasilkan format tool call yang tidak valid: {text!r}")


# ---------------------------------------------------------------------------
# Langkah 1: Memutuskan tool
# ---------------------------------------------------------------------------

_DECISION_SYSTEM_PROMPT = """Kamu adalah router untuk AI Business Agent. Tugasmu HANYA \
menentukan tool apa yang dibutuhkan untuk menjawab permintaan user. Kamu TIDAK menjawab \
pertanyaan bisnis atau melakukan perhitungan sendiri.

Tool yang tersedia:
- "calculator": untuk operasi matematika (tambah, kurang, kali, bagi, persen).
  Wajib sertakan field "input" berisi ekspresi matematika murni,
  contoh: "50*(120000-80000)" atau "500000*20%"
- "sales_analysis": untuk analisis data penjualan (total revenue, total cost,
  total profit, profit margin, produk terlaris, produk paling untung).
  Tidak butuh field "input".
- "none": jika permintaan bisa dijawab langsung tanpa tool (sapaan, pertanyaan
  umum di luar topik bisnis, atau permintaan yang butuh data yang belum tersedia).
  Wajib sertakan field "message" berisi jawaban singkat untuk user.

ATURAN WAJIB:
1. Balas HANYA dengan satu objek JSON. Tanpa teks lain. Tanpa markdown. Tanpa penjelasan.
2. Jangan pernah mencoba menghitung sendiri angka apa pun.

Contoh:
User: "Berapa 125000 dikali 35?"
{"tool": "calculator", "input": "125000*35"}

User: "Analisis data penjualan saya"
{"tool": "sales_analysis"}

User: "Halo"
{"tool": "none", "message": "Halo! Ada yang bisa saya bantu terkait bisnis Anda?"}

User: "Berapa keuntungan saya bulan ini?"
{"tool": "none", "message": "Saya belum punya data penjualan bulan ini. Coba minta saya \
'analisis data penjualan' agar saya bisa membaca data yang tersedia."}
"""


def decide_tool(user_input: str) -> dict:
    """Meminta LLM memutuskan tool mana yang dipakai. Mengembalikan dict hasil parse JSON."""
    raw = _call_ollama(prompt=user_input, system=_DECISION_SYSTEM_PROMPT)
    decision = _extract_json(raw)

    if "tool" not in decision:
        raise AgentError(f"Respons model tidak berisi field 'tool': {decision!r}")

    return decision


# ---------------------------------------------------------------------------
# Langkah 2: Menjalankan tool (murni Python, tidak menyentuh LLM)
# ---------------------------------------------------------------------------

def execute_tool(decision: dict) -> dict:
    """
    Menjalankan tool sesuai keputusan LLM.

    Mengembalikan dict berisi minimal {"tool": ..., "result": ...}.
    Melempar AgentError / tools.CalculatorError / tools.SalesDataError bila gagal.
    """
    tool_name = decision.get("tool")

    if tool_name == "calculator":
        expression = decision.get("input")
        if not expression:
            raise AgentError("Model memilih 'calculator' tapi tidak menyertakan 'input'")
        value = tools.calculate(expression)
        return {"tool": "calculator", "expression": expression, "result": value}

    if tool_name == "sales_analysis":
        data = tools.read_sales_data(config.SALES_DATA_PATH)
        summary = tools.analyze_sales(data)
        return {"tool": "sales_analysis", "result": summary}

    if tool_name == "none":
        return {"tool": "none", "result": decision.get("message", "")}

    raise AgentError(f"Tool tidak dikenal: {tool_name!r}")


# ---------------------------------------------------------------------------
# Langkah 3: Memformat hasil untuk user (Python murni, tidak menyentuh LLM)
# ---------------------------------------------------------------------------

def _format_currency(value) -> str:
    try:
        return f"Rp{value:,.0f}".replace(",", ".")
    except (TypeError, ValueError):
        return str(value)


def format_result(tool_result: dict) -> str:
    """
    Mengubah hasil tool jadi teks rapi untuk ditampilkan di CLI.

    Ini murni formatting string di Python — tidak ada panggilan LLM,
    sehingga angka yang tampil ke user dijamin identik dengan angka
    yang dihitung tools.py, tidak ada risiko "salah salin ulang" oleh model.
    """
    tool_name = tool_result.get("tool")

    if tool_name == "calculator":
        return f"Hasil: {tool_result['expression']} = {tool_result['result']}"

    if tool_name == "sales_analysis":
        r = tool_result["result"]
        return (
            f"Total Revenue : {_format_currency(r['total_revenue'])}\n"
            f"Total Cost    : {_format_currency(r['total_cost'])}\n"
            f"Total Profit  : {_format_currency(r['total_profit'])}\n"
            f"Profit Margin : {r['profit_margin']}%\n\n"
            f"Produk Terlaris     : {r['best_seller_product']} ({r['best_seller_quantity']} unit)\n"
            f"Produk Paling Untung: {r['most_profitable_product']} "
            f"({_format_currency(r['most_profitable_value'])})"
        )

    if tool_name == "none":
        return tool_result.get("result", "")

    return str(tool_result)


# ---------------------------------------------------------------------------
# Orkestrasi utama
# ---------------------------------------------------------------------------

def run(user_input: str, log=print) -> str:
    """
    Menjalankan satu siklus penuh: decide -> execute -> format.
    `log` adalah fungsi untuk menampilkan status tool (lihat main.py).
    """
    if not user_input or not user_input.strip():
        raise AgentError("Input tidak boleh kosong")

    decision = decide_tool(user_input)
    tool_name = decision.get("tool", "none")
    log(f"[Agent] Selecting tool: {tool_name}")

    tool_result = execute_tool(decision)
    if tool_name != "none":
        log(f"[Tool] {tool_name} executed")
        log("[Tool] Result received")

    return format_result(tool_result)
