import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, Field, Input, PageHeader, Textarea, toast } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { companyProfileService } from "../services/api";
import { useTheme } from "../hooks/useTheme";

const EMPTY_PROFILE = { name: "", industry: "", email: "", phone: "", website: "", address: "", taxId: "" };
const densityOptions = [
  ["simple", "Sederhana", "Tabel lebih lega dan fokus pada informasi utama."],
  ["standard", "Standar", "Keseimbangan antara ringkasan dan detail."],
  ["advanced", "Lanjutan", "Tabel lebih rapat untuk memindai banyak baris."],
];

export default function Settings() {
  const { density, setDensity } = useOutletContext();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [theme, toggleTheme] = useTheme();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canEditProfile = user?.role === "admin";

  useEffect(() => {
    let active = true;
    companyProfileService.get()
      .then((data) => {
        if (active) setProfile({ ...EMPTY_PROFILE, ...data });
      })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = (key) => (event) => setProfile((value) => ({ ...value, [key]: event.target.value }));
  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await companyProfileService.update(profile);
      setProfile({ ...EMPTY_PROFILE, ...saved });
      toast(t("Profil perusahaan berhasil disimpan."));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeader title={t("Preferensi tampilan")} desc={t("Kelola profil perusahaan, bahasa, dan preferensi tampilan.")} />
    <div className="max-w-3xl space-y-4">
      <Card title={t("Profil perusahaan")}>
        <form onSubmit={saveProfile} className="space-y-4 p-4">
          <p className="text-xs leading-5 text-text-secondary">{t("Informasi ini digunakan sebagai profil perusahaan di workspace Anda.")}</p>
          {error && <p className="rounded-lg border border-negative/30 bg-negative-bg p-3 text-sm text-negative" role="alert">{error}</p>}
          {loading ? <p className="py-4 text-sm text-text-muted">{t("Memuat…")}</p> : <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Nama perusahaan")}><Input value={profile.name} onChange={update("name")} maxLength={160} disabled={!canEditProfile} /></Field>
              <Field label={t("Industri")}><Input value={profile.industry} onChange={update("industry")} maxLength={120} disabled={!canEditProfile} /></Field>
              <Field label={t("Email perusahaan")}><Input type="email" value={profile.email} onChange={update("email")} maxLength={254} disabled={!canEditProfile} /></Field>
              <Field label={t("Nomor telepon")}><Input type="tel" value={profile.phone} onChange={update("phone")} maxLength={40} disabled={!canEditProfile} /></Field>
              <Field label={t("Situs web")}><Input type="url" value={profile.website} onChange={update("website")} maxLength={255} disabled={!canEditProfile} /></Field>
              <Field label={t("NPWP / ID pajak")}><Input value={profile.taxId} onChange={update("taxId")} maxLength={80} disabled={!canEditProfile} /></Field>
            </div>
            <Field label={t("Alamat")}><Textarea value={profile.address} onChange={update("address")} rows={3} maxLength={500} disabled={!canEditProfile} /></Field>
            {canEditProfile ? <button type="submit" disabled={saving} className="h-9 rounded-lg bg-brand-gradient px-4 text-sm font-medium text-accent-foreground disabled:opacity-50">{saving ? t("Menyimpan…") : t("Simpan profil")}</button> : <p className="text-xs text-text-muted">{t("Hanya administrator yang dapat mengubah profil perusahaan.")}</p>}
          </>}
        </form>
      </Card>
      <Card title={t("Pilih bahasa")}>
        <div className="space-y-3 p-4">
          <Field label={t("Bahasa antarmuka")}>
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-accent sm:max-w-sm">
              <option value="id-ID">Indonesia</option>
              <option value="en-US">English (US)</option>
            </select>
          </Field>
          <p className="text-xs text-text-secondary">{t("Bahasa disimpan di browser ini.")}</p>
        </div>
      </Card>
      <Card title={t("Kepadatan informasi")}>
        <fieldset className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <legend className="sr-only">{t("Kepadatan informasi")}</legend>
          {densityOptions.map(([value, label, description]) => <label key={value} className="flex cursor-pointer gap-3 p-4 hover:bg-surface-elevated">
            <input type="radio" name="density" value={value} checked={density === value} onChange={() => setDensity(value)} className="mt-1 accent-accent" />
            <span><span className="block text-sm font-medium">{t(label)}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{t(description)}</span></span>
          </label>)}
        </fieldset>
      </Card>
      <Card title={t("Tema warna")}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><p className="text-sm font-medium">{t(theme === "dark" ? "Gelap" : "Terang")}</p><p className="mt-1 text-xs text-text-secondary">{t("Awalnya mengikuti preferensi perangkat. Pilihan manual disimpan di browser ini.")}</p></div>
          <button type="button" onClick={toggleTheme} className="h-9 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-elevated" aria-label={t("Ganti tema")}>{t(theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap")}</button>
        </div>
      </Card>
    </div>
  </>;
}
