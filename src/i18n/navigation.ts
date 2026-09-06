import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale'i otomatik koruyan navigasyon yardımcıları.
 * Uygulama içi bağlantılarda `next/link` yerine BUNLARI kullanın —
 * aksi halde dil öneki kaybolur.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
