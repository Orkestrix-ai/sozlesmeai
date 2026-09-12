import type { ContractTemplate } from "./types";

/** Gizlilik sözleşmesi. Madde anahtarları `contract_types.section_keys` ('nda') ile birebir. */
export const ndaTemplate: ContractTemplate = {
  id: "nda",
  contractTypeCode: "nda",
  category: "confidentiality",
  nameKey: "items.nda.name",
  descriptionKey: "items.nda.description",
  version: 1,
  status: "active",
  titleField: "receivingParty",
  fields: [
    {
      name: "disclosingParty",
      type: "text",
      group: "parties",
      labelKey: "items.nda.fields.disclosingParty.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "disclosingPartyId",
      type: "text",
      group: "parties",
      labelKey: "items.nda.fields.disclosingPartyId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "receivingParty",
      type: "text",
      group: "parties",
      labelKey: "items.nda.fields.receivingParty.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "receivingPartyId",
      type: "text",
      group: "parties",
      labelKey: "items.nda.fields.receivingPartyId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "purpose",
      type: "textarea",
      group: "subject",
      labelKey: "items.nda.fields.purpose.label",
      placeholderKey: "items.nda.fields.purpose.placeholder",
      required: true,
      maxLength: 600,
    },
    {
      name: "confidentialScope",
      type: "textarea",
      group: "subject",
      labelKey: "items.nda.fields.confidentialScope.label",
      placeholderKey: "items.nda.fields.confidentialScope.placeholder",
      required: false,
      maxLength: 800,
    },
    {
      name: "effectiveDate",
      type: "date",
      group: "term",
      labelKey: "items.nda.fields.effectiveDate.label",
      required: true,
    },
    {
      name: "durationYears",
      type: "number",
      group: "term",
      labelKey: "items.nda.fields.durationYears.label",
      placeholderKey: "items.nda.fields.durationYears.placeholder",
      required: true,
      defaultValue: "3",
    },
  ],
  content: {
    tr: [
      {
        key: "parties",
        titleKey: "items.nda.articles.parties",
        body: `Açıklayan Taraf: {{disclosingParty}}
T.C. Kimlik / Vergi No: {{disclosingPartyId}}

Alan Taraf: {{receivingParty}}
T.C. Kimlik / Vergi No: {{receivingPartyId}}`,
      },
      {
        key: "confidential_information",
        titleKey: "items.nda.articles.confidential_information",
        body: `Gizli bilgi, Açıklayan Taraf'ın Alan Taraf'a yazılı, sözlü veya elektronik olarak aktardığı, kamuya açık olmayan her türlü bilgidir.

Kapsam: {{confidentialScope}}

Bilginin gizli olduğunun ayrıca işaretlenmemiş olması, onu bu sözleşmenin kapsamı dışına çıkarmaz.`,
      },
      {
        key: "obligations",
        titleKey: "items.nda.articles.obligations",
        body: `Alan Taraf, gizli bilgiyi yalnızca şu amaçla kullanır: {{purpose}}

Alan Taraf gizli bilgiyi üçüncü kişilerle paylaşamaz; yalnızca bu amaç için bilmesi gereken çalışanlarına ve danışmanlarına, onları aynı gizlilik yükümlülüğüne bağlamak kaydıyla aktarabilir. Alan Taraf, gizli bilgiyi kendi gizli bilgilerine gösterdiği özenden az olmamak üzere korur.`,
      },
      {
        key: "term",
        titleKey: "items.nda.articles.term",
        body: `Sözleşme {{effectiveDate}} tarihinde yürürlüğe girer. Gizlilik yükümlülüğü, bilginin paylaşıldığı tarihten itibaren {{durationYears}} yıl boyunca devam eder ve tarafların ticari ilişkisinin sona ermesi bu süreyi kısaltmaz.`,
      },
      {
        key: "exceptions",
        titleKey: "items.nda.articles.exceptions",
        body: `Aşağıdaki bilgiler gizli bilgi sayılmaz: paylaşıldığı anda kamuya açık olan bilgiler; Alan Taraf'ın kusuru olmaksızın kamuya açık hâle gelen bilgiler; Alan Taraf'ın gizlilik yükümlülüğü altında olmayan üçüncü bir kişiden hukuka uygun biçimde edindiği bilgiler; Alan Taraf'ın gizli bilgiden bağımsız olarak kendi ürettiği bilgiler.

Yetkili bir merci tarafından hukuken zorunlu kılınan açıklamalar bu maddeye aykırılık oluşturmaz; Alan Taraf mümkün olan en kısa sürede Açıklayan Taraf'ı bilgilendirir.`,
      },
      {
        key: "remedies",
        titleKey: "items.nda.articles.remedies",
        body: `Gizlilik yükümlülüğünün ihlali hâlinde Açıklayan Taraf, ihlalin durdurulmasını ve doğan zararının giderilmesini talep edebilir. Bu sözleşme, taraflar arasında ayrıca bir ticari ilişki kurulduğu anlamına gelmez ve hiçbir tarafa lisans veya kullanım hakkı vermez.`,
      },
    ],
    en: [
      {
        key: "parties",
        titleKey: "items.nda.articles.parties",
        body: `Disclosing Party: {{disclosingParty}}
ID / Tax No: {{disclosingPartyId}}

Receiving Party: {{receivingParty}}
ID / Tax No: {{receivingPartyId}}`,
      },
      {
        key: "confidential_information",
        titleKey: "items.nda.articles.confidential_information",
        body: `Confidential information means any non-public information the Disclosing Party shares with the Receiving Party in written, oral or electronic form.

Scope: {{confidentialScope}}

The absence of a confidentiality marking does not place information outside the scope of this agreement.`,
      },
      {
        key: "obligations",
        titleKey: "items.nda.articles.obligations",
        body: `The Receiving Party shall use the confidential information solely for the following purpose: {{purpose}}

The Receiving Party shall not share the confidential information with third parties; it may pass it on only to those employees and advisers who need to know it for that purpose, and only if they are bound by the same duty of confidentiality. The Receiving Party shall protect the information with no less care than it applies to its own confidential information.`,
      },
      {
        key: "term",
        titleKey: "items.nda.articles.term",
        body: `This agreement takes effect on {{effectiveDate}}. The duty of confidentiality continues for {{durationYears}} years from the date the information was shared, and the end of any commercial relationship between the parties does not shorten that period.`,
      },
      {
        key: "exceptions",
        titleKey: "items.nda.articles.exceptions",
        body: `The following is not treated as confidential information: information already public when shared; information that becomes public without fault of the Receiving Party; information lawfully obtained from a third party not bound by a duty of confidentiality; and information the Receiving Party develops independently of the confidential information.

A disclosure legally required by a competent authority does not breach this article; the Receiving Party shall notify the Disclosing Party as soon as reasonably possible.`,
      },
      {
        key: "remedies",
        titleKey: "items.nda.articles.remedies",
        body: `In the event of a breach, the Disclosing Party may require the breach to stop and claim compensation for the loss suffered. This agreement does not establish any further commercial relationship between the parties and grants no licence or right of use to either of them.`,
      },
    ],
  },
};
