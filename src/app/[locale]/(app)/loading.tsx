import { getTranslations } from "next-intl/server";

export default async function AppLoading() {
  const t = await getTranslations("common.actions");

  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="size-6 animate-spin rounded-full border-2 border-stone-200 border-t-brand-red-600"
        role="status"
        aria-label={t("loading")}
      />
    </div>
  );
}
