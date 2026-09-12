import { Briefcase, Handshake, House, ShieldCheck, UserMinus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { TemplateCategory } from "@/lib/contracts/templates";

/**
 * Kategori → ikon. design.md §1: ikonlar çizgisel ve aynı kalınlıkta
 * (`lucide-react`); robot/beyin/sihirli değnek yok.
 *
 * Şablon dosyalarında DEĞİL burada duruyor: `src/lib/contracts/templates/*`
 * saf veri katmanı ve sunucuda da çalışıyor — bir React bileşenini oraya
 * sokmak o katmanı gereksiz yere React'e bağlardı.
 */
export const CATEGORY_ICONS: Record<TemplateCategory, LucideIcon> = {
  lease: House,
  employment: Briefcase,
  confidentiality: ShieldCheck,
  services: Handshake,
  hr: UserMinus,
};
