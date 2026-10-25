import readXlsxFile, { readSheetNames } from "read-excel-file";

export const MAX_BYTES = 12 * 1024 * 1024;
export const MAX_ROWS = 200000;

/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, auto delimiter). */
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = [";", "\t", ","].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export async function listSheets(file) {
  if (/\.csv$|\.txt$/i.test(file.name)) return ["CSV"];
  return readSheetNames(file);
}

/** → { headers: string[], body: any[][] } using the first non-empty row as header. */
export async function readTable(file, sheetIndex = 0) {
  if (file.size > MAX_BYTES) throw new Error(`Ukuran file maksimal ${MAX_BYTES / 1024 / 1024} MB.`);
  if (/\.xls$/i.test(file.name)) throw new Error("Format .xls lama belum didukung. Simpan ulang sebagai .xlsx atau .csv di Excel (File → Save As).");
  let rows;
  if (/\.csv$|\.txt$/i.test(file.name)) rows = parseCSV(await file.text());
  else if (/\.xlsx$/i.test(file.name)) rows = await readXlsxFile(file, { sheet: sheetIndex + 1 });
  else throw new Error("Gunakan file .xlsx atau .csv.");
  const hi = rows.findIndex((r) => r.filter((c) => c != null && String(c).trim() !== "").length >= 2);
  if (hi < 0) throw new Error("Sheet kosong atau tidak memiliki header kolom.");
  const headers = rows[hi].map((h, i) => (h == null || String(h).trim() === "" ? `Kolom ${i + 1}` : String(h).trim()));
  const body = rows.slice(hi + 1);
  if (body.length > MAX_ROWS) throw new Error(`Maksimal ${MAX_ROWS.toLocaleString("id-ID")} baris per file.`);
  return { headers, body };
}
