import "server-only";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { CONTRACT_BODY_FONT, CONTRACT_HEADING_FONT, registerContractFonts } from "@/lib/pdf/fonts";
import type { ContractSections } from "@/lib/contracts/schema";

/**
 * FR-08 — "başlık, taraflar, tarih ve içerik". Taraf isimleri ayrı bir
 * yapılandırılmış alan olarak şemada yok (design.md/prd.md bunu istemiyor);
 * FR-04'ün "parties" bölümü zaten bu bilgiyi metin içinde taşıyor, o yüzden
 * ayrıca icat edilmedi. "Sürüme bağlı dosya adı" için bkz. pdf route'u
 * (contract-{id}-v{n}.pdf).
 */
const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: CONTRACT_BODY_FONT,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  title: {
    fontFamily: CONTRACT_HEADING_FONT,
    fontSize: 20,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: CONTRACT_BODY_FONT,
    fontWeight: 700,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 8,
    color: "#888888",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export function ContractDocument({
  title,
  versionNo,
  generatedAt,
  sections,
}: {
  title: string;
  versionNo: number;
  generatedAt: Date;
  sections: ContractSections;
}) {
  registerContractFonts();

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          Sürüm {versionNo} · {generatedAt.toLocaleDateString("tr-TR")}
        </Text>

        {sections.map((section) => (
          <View key={section.key} wrap={false} style={{ marginBottom: 4 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Sözleşme Stüdyosu</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
