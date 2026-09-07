import * as React from "react";

/**
 * Her (app) sayfasının başlık şeridi — design.md §7.1 başlık/gövde tonlarını
 * tekrarlamamak için tek yerde toplanır. `action`, ekranın TEK birincil
 * aksiyonu için ayrılmıştır (design.md §5); ikinci bir primary buton buraya
 * geçirilmemelidir.
 */
function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-page-title font-heading text-ink-950">{title}</h1>
        {description && <p className="mt-1 text-body text-stone-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { PageHeader };
