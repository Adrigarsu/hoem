import { useTranslations } from "next-intl";

export function HomeHeading() {
  const t = useTranslations("Home");
  return (
    <h1 className="text-display">
      {t.rich("title", { brand: (chunks) => <span className="text-brand">{chunks}</span> })}
    </h1>
  );
}
