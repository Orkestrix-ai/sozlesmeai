import type { ContractTemplate } from "./types";

/**
 * Kira sözleşmesi. Madde anahtarları `contract_types.section_keys` ('rental')
 * ile birebir — bkz. 20260912100000_template_contract_types.sql.
 *
 * `parties` maddesinin "Rol: değer" satır biçimi zorunludur: imza bloğundaki
 * taraf başlıklarını `document-model.ts` → `partyLabels()` bu satırlardan
 * türetir ve "T.C. Kimlik / Vergi No" gibi öznitelik satırlarını eler.
 */
export const rentalTemplate: ContractTemplate = {
  id: "rental",
  contractTypeCode: "rental",
  category: "lease",
  nameKey: "items.rental.name",
  descriptionKey: "items.rental.description",
  version: 1,
  status: "active",
  titleField: "tenantName",
  fields: [
    {
      name: "landlordName",
      type: "text",
      group: "parties",
      labelKey: "items.rental.fields.landlordName.label",
      placeholderKey: "items.rental.fields.landlordName.placeholder",
      required: true,
      maxLength: 160,
    },
    {
      name: "landlordId",
      type: "text",
      group: "parties",
      labelKey: "items.rental.fields.landlordId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "tenantName",
      type: "text",
      group: "parties",
      labelKey: "items.rental.fields.tenantName.label",
      placeholderKey: "items.rental.fields.tenantName.placeholder",
      required: true,
      maxLength: 160,
    },
    {
      name: "tenantId",
      type: "text",
      group: "parties",
      labelKey: "items.rental.fields.tenantId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "propertyAddress",
      type: "textarea",
      group: "subject",
      labelKey: "items.rental.fields.propertyAddress.label",
      placeholderKey: "items.rental.fields.propertyAddress.placeholder",
      required: true,
      maxLength: 400,
    },
    {
      name: "rentAmount",
      type: "number",
      group: "financial",
      labelKey: "items.rental.fields.rentAmount.label",
      placeholderKey: "items.rental.fields.rentAmount.placeholder",
      required: true,
    },
    {
      name: "depositAmount",
      type: "number",
      group: "financial",
      labelKey: "items.rental.fields.depositAmount.label",
      placeholderKey: "items.rental.fields.depositAmount.placeholder",
      required: false,
    },
    {
      name: "paymentDay",
      type: "number",
      group: "financial",
      labelKey: "items.rental.fields.paymentDay.label",
      placeholderKey: "items.rental.fields.paymentDay.placeholder",
      required: true,
    },
    {
      name: "paymentMethod",
      type: "select",
      group: "financial",
      labelKey: "items.rental.fields.paymentMethod.label",
      required: true,
      defaultValue: "bank",
      options: [
        { value: "bank", labelKey: "items.rental.fields.paymentMethod.options.bank" },
        { value: "cash", labelKey: "items.rental.fields.paymentMethod.options.cash" },
      ],
    },
    {
      name: "startDate",
      type: "date",
      group: "term",
      labelKey: "items.rental.fields.startDate.label",
      required: true,
    },
    {
      name: "durationMonths",
      type: "number",
      group: "term",
      labelKey: "items.rental.fields.durationMonths.label",
      placeholderKey: "items.rental.fields.durationMonths.placeholder",
      required: true,
      defaultValue: "12",
    },
    {
      name: "specialTerms",
      type: "textarea",
      group: "other",
      labelKey: "items.rental.fields.specialTerms.label",
      placeholderKey: "items.rental.fields.specialTerms.placeholder",
      required: false,
      maxLength: 2000,
    },
  ],
  content: {
    tr: [
      {
        key: "parties",
        titleKey: "items.rental.articles.parties",
        body: `Kiraya Veren: {{landlordName}}
T.C. Kimlik / Vergi No: {{landlordId}}

Kiracı: {{tenantName}}
T.C. Kimlik / Vergi No: {{tenantId}}`,
      },
      {
        key: "subject",
        titleKey: "items.rental.articles.subject",
        body: `İşbu sözleşmenin konusu, aşağıda adresi belirtilen taşınmazın Kiraya Veren tarafından Kiracı'ya kiralanmasıdır.

Taşınmazın adresi: {{propertyAddress}}

Kiracı, taşınmazı sözleşmede öngörülen kullanım amacı dışında kullanamaz.`,
      },
      {
        key: "rent",
        titleKey: "items.rental.articles.rent",
        body: `Aylık kira bedeli {{rentAmount}} TL olarak kararlaştırılmıştır. Kira bedeli, tarafların yazılı mutabakatı olmaksızın sözleşme süresi içinde değiştirilemez.`,
      },
      {
        key: "deposit",
        titleKey: "items.rental.articles.deposit",
        omitWhenEmpty: "depositAmount",
        body: `Kiracı, sözleşmenin imzalanmasıyla birlikte Kiraya Veren'e {{depositAmount}} TL tutarında depozito öder. Depozito, sözleşmenin sona ermesi ve taşınmazın teslim edilmesinden sonra, varsa hasar bedelleri ve ödenmemiş borçlar mahsup edilerek Kiracı'ya iade edilir.`,
      },
      {
        key: "term",
        titleKey: "items.rental.articles.term",
        body: `Kira süresi {{startDate}} tarihinde başlar ve {{durationMonths}} ay devam eder. Sürenin bitiminden en az otuz gün önce taraflardan biri yazılı bildirimde bulunmazsa sözleşme aynı koşullarla bir yıl uzamış sayılır.`,
      },
      {
        key: "payment",
        titleKey: "items.rental.articles.payment",
        body: `Kira bedeli her ayın {{paymentDay}}. günü {{paymentMethod}} yoluyla Kiraya Veren'e ödenir. Ödemenin gecikmesi hâlinde Kiraya Veren'in gecikme faizi talep etme hakkı saklıdır.`,
      },
      {
        key: "obligations",
        titleKey: "items.rental.articles.obligations",
        body: `Kiracı, taşınmazı özenle kullanmak ve kendi kusurundan doğan hasarları gidermekle yükümlüdür. Kiraya Veren, taşınmazı sözleşmede öngörülen kullanıma elverişli hâlde teslim etmek ve süre boyunca bu hâlde bulundurmakla yükümlüdür.

Kiracı, Kiraya Veren'in yazılı izni olmaksızın taşınmazda kalıcı değişiklik yapamaz, taşınmazı başkasına devredemez veya alt kiraya veremez.`,
      },
      {
        key: "utilities",
        titleKey: "items.rental.articles.utilities",
        body: `Elektrik, su, doğal gaz ve internet gibi abonelik bedelleri ile kullanımdan doğan aidat giderleri Kiracı'ya aittir. Ana yapıya ilişkin zorunlu giderler ve emlak vergisi Kiraya Veren'e aittir.`,
      },
      {
        key: "termination",
        titleKey: "items.rental.articles.termination",
        body: `Taraflardan her biri, diğerinin sözleşmeden doğan yükümlülüklerini ihlal etmesi ve kendisine verilen uygun sürede ihlali gidermemesi hâlinde sözleşmeyi feshedebilir. Fesih hâlinde Kiracı, taşınmazı teslim aldığı hâliyle boşaltarak Kiraya Veren'e teslim eder.`,
      },
      {
        key: "special_terms",
        titleKey: "items.rental.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
    en: [
      {
        key: "parties",
        titleKey: "items.rental.articles.parties",
        body: `Landlord: {{landlordName}}
ID / Tax No: {{landlordId}}

Tenant: {{tenantName}}
ID / Tax No: {{tenantId}}`,
      },
      {
        key: "subject",
        titleKey: "items.rental.articles.subject",
        body: `The subject of this agreement is the lease by the Landlord to the Tenant of the property identified below.

Address of the property: {{propertyAddress}}

The Tenant shall not use the property for any purpose other than the one set out in this agreement.`,
      },
      {
        key: "rent",
        titleKey: "items.rental.articles.rent",
        body: `The monthly rent is agreed at TRY {{rentAmount}}. The rent may not be changed during the term without the written agreement of both parties.`,
      },
      {
        key: "deposit",
        titleKey: "items.rental.articles.deposit",
        omitWhenEmpty: "depositAmount",
        body: `Upon signing this agreement the Tenant shall pay the Landlord a deposit of TRY {{depositAmount}}. The deposit is returned to the Tenant after the agreement ends and the property is handed back, less any damages and unpaid amounts.`,
      },
      {
        key: "term",
        titleKey: "items.rental.articles.term",
        body: `The lease begins on {{startDate}} and runs for {{durationMonths}} months. Unless either party gives written notice at least thirty days before the end of the term, the agreement is extended by one year on the same terms.`,
      },
      {
        key: "payment",
        titleKey: "items.rental.articles.payment",
        body: `The rent is paid to the Landlord by {{paymentMethod}} on day {{paymentDay}} of each month. If payment is late, the Landlord reserves the right to claim default interest.`,
      },
      {
        key: "obligations",
        titleKey: "items.rental.articles.obligations",
        body: `The Tenant shall use the property with care and shall remedy any damage caused by their own fault. The Landlord shall hand over the property fit for the agreed use and keep it in that condition for the term.

The Tenant may not make permanent alterations, transfer the property to a third party or sublet it without the Landlord's written consent.`,
      },
      {
        key: "utilities",
        titleKey: "items.rental.articles.utilities",
        body: `Utility subscriptions such as electricity, water, gas and internet, together with usage-based service charges, are borne by the Tenant. Mandatory expenses relating to the main structure and property tax are borne by the Landlord.`,
      },
      {
        key: "termination",
        titleKey: "items.rental.articles.termination",
        body: `Either party may terminate this agreement if the other breaches its obligations and fails to remedy the breach within a reasonable period given to it. On termination the Tenant shall vacate the property and hand it back in the condition in which it was received.`,
      },
      {
        key: "special_terms",
        titleKey: "items.rental.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
  },
};
