import { Card, Field, PageHeader } from "../components/ui";
import { useLanguage } from "../context/LanguageContext";

export default function DemoSettings() {
  const { language, setLanguage, t } = useLanguage();

  return <>
    <PageHeader title={t("Pengaturan demo")} desc={t("Atur bahasa antarmuka untuk mode demo.")} />
    <div className="max-w-3xl">
      <Card title={t("Pilih bahasa")}>
        <div className="space-y-3 p-4">
          <Field label={t("Bahasa antarmuka")}>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-accent sm:max-w-sm"
            >
              <option value="id-ID">Indonesia</option>
              <option value="en-US">English (US)</option>
            </select>
          </Field>
          <p className="text-xs text-text-secondary">{t("Bahasa disimpan di browser ini.")}</p>
        </div>
      </Card>
    </div>
  </>;
}
