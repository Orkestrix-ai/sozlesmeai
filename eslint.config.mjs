import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // 2. sütun (SQL Injection Önleme): projede ORM yok, gerçek enjeksiyon
    // yüzeyi PostgREST filtre string'lerine yapılacak interpolasyon/
    // birleştirmedir. `.or()/.filter()/.textSearch()/.not()` bir sorgu
    // dizesi alır — bu kurallar oraya template literal veya `+` ile
    // birleştirme geçmesini derleme zamanında engeller.
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.property.name=/^(or|filter|textSearch|not)$/] > TemplateLiteral',
          message:
            "PostgREST filtre string'ine interpolasyon yasak — .eq()/.in() gibi parametrik yardımcıları kullan.",
        },
        {
          selector:
            'CallExpression[callee.property.name=/^(or|filter|textSearch|not)$/] > BinaryExpression[operator="+"]',
          message: "PostgREST filtre string'i birleştirme yasak.",
        },
      ],
    },
  },
  {
    // 4. sütun (En Az Yetki): service-role istemcisi (RLS'i TAMAMEN atlar)
    // yalnızca bu iki dosyada kullanılabilir. Yeni bir kullanım yeri,
    // önce SECURITY DEFINER bir RPC değerlendirilmeden eklenmemeli —
    // bkz. src/lib/supabase/admin.ts başlığı.
    files: ["src/**/*.ts", "src/**/*.tsx"],
    // Glob köşeli parantezleri karakter sınıfı sayar — `[locale]`/`[token]`
    // literal eşleşsin diye kaçırılmak ZORUNDA (\\[ ... \\]).
    ignores: ["src/lib/supabase/admin.ts", "src/app/\\[locale\\]/s/\\[token\\]/page.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message:
                "Service-role RLS'i atlar. Yeni bir kullanım yeri eklemeden önce SECURITY DEFINER RPC değerlendir.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
