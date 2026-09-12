import type { ContractTemplate } from "./types";

/** Hizmet sözleşmesi. Madde anahtarları `contract_types.section_keys` ('service') ile birebir. */
export const serviceTemplate: ContractTemplate = {
  id: "service",
  contractTypeCode: "service",
  category: "services",
  nameKey: "items.service.name",
  descriptionKey: "items.service.description",
  version: 1,
  status: "active",
  titleField: "clientName",
  fields: [
    {
      name: "providerName",
      type: "text",
      group: "parties",
      labelKey: "items.service.fields.providerName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "providerId",
      type: "text",
      group: "parties",
      labelKey: "items.service.fields.providerId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "clientName",
      type: "text",
      group: "parties",
      labelKey: "items.service.fields.clientName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "clientId",
      type: "text",
      group: "parties",
      labelKey: "items.service.fields.clientId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "serviceScope",
      type: "textarea",
      group: "subject",
      labelKey: "items.service.fields.serviceScope.label",
      placeholderKey: "items.service.fields.serviceScope.placeholder",
      required: true,
      maxLength: 1200,
    },
    {
      name: "feeAmount",
      type: "number",
      group: "financial",
      labelKey: "items.service.fields.feeAmount.label",
      placeholderKey: "items.service.fields.feeAmount.placeholder",
      required: true,
    },
    {
      name: "paymentSchedule",
      type: "select",
      group: "financial",
      labelKey: "items.service.fields.paymentSchedule.label",
      required: true,
      defaultValue: "monthly",
      options: [
        { value: "monthly", labelKey: "items.service.fields.paymentSchedule.options.monthly" },
        { value: "milestone", labelKey: "items.service.fields.paymentSchedule.options.milestone" },
        { value: "onDelivery", labelKey: "items.service.fields.paymentSchedule.options.onDelivery" },
      ],
    },
    {
      name: "startDate",
      type: "date",
      group: "term",
      labelKey: "items.service.fields.startDate.label",
      required: true,
    },
    {
      name: "endDate",
      type: "date",
      group: "term",
      labelKey: "items.service.fields.endDate.label",
      required: false,
    },
  ],
  content: {
    tr: [
      {
        key: "parties",
        titleKey: "items.service.articles.parties",
        body: `Hizmet Veren: {{providerName}}
T.C. Kimlik / Vergi No: {{providerId}}

Hizmet Alan: {{clientName}}
T.C. Kimlik / Vergi No: {{clientId}}`,
      },
      {
        key: "scope",
        titleKey: "items.service.articles.scope",
        body: `Hizmet Veren, Hizmet Alan'a aşağıda tanımlanan hizmeti sunmayı taahhüt eder.

{{serviceScope}}

Kapsam dışındaki talepler, tarafların yazılı olarak mutabık kalması hâlinde ayrıca ücretlendirilir.`,
      },
      {
        key: "payment",
        titleKey: "items.service.articles.payment",
        body: `Hizmet bedeli {{feeAmount}} TL olarak kararlaştırılmıştır. Ödeme planı: {{paymentSchedule}}.

Fatura tarihinden itibaren on beş gün içinde ödenmeyen tutarlar için Hizmet Veren'in gecikme faizi talep etme ve hizmeti askıya alma hakkı saklıdır.`,
      },
      {
        key: "term",
        titleKey: "items.service.articles.term",
        body: `Sözleşme {{startDate}} tarihinde başlar ve {{endDate}} tarihinde sona erer. Tarafların yazılı mutabakatı ile süre uzatılabilir.`,
      },
      {
        key: "termination",
        titleKey: "items.service.articles.termination",
        body: `Taraflardan her biri, otuz gün önceden yazılı bildirimde bulunmak kaydıyla sözleşmeyi feshedebilir. Fesih tarihine kadar sunulmuş hizmetlerin bedeli Hizmet Veren'e ödenir. Diğer tarafın yükümlülüklerini ihlal etmesi ve verilen uygun sürede ihlali gidermemesi hâlinde bildirim süresi aranmaz.`,
      },
      {
        key: "liability",
        titleKey: "items.service.articles.liability",
        body: `Hizmet Veren, hizmeti mesleki özen yükümlülüğüne uygun biçimde sunar. Hizmet Alan, hizmetin yürütülmesi için gerekli bilgi, belge ve erişimleri zamanında sağlamakla yükümlüdür; bunların eksikliğinden doğan gecikmelerden Hizmet Veren sorumlu tutulamaz.

Tarafların sözleşmeden doğan sorumluluğu, aksi kanunen öngörülmedikçe, sözleşme kapsamında ödenen toplam bedelle sınırlıdır.`,
      },
    ],
    en: [
      {
        key: "parties",
        titleKey: "items.service.articles.parties",
        body: `Service Provider: {{providerName}}
ID / Tax No: {{providerId}}

Client: {{clientName}}
ID / Tax No: {{clientId}}`,
      },
      {
        key: "scope",
        titleKey: "items.service.articles.scope",
        body: `The Service Provider undertakes to provide the Client with the services described below.

{{serviceScope}}

Requests falling outside this scope are charged separately, subject to the written agreement of both parties.`,
      },
      {
        key: "payment",
        titleKey: "items.service.articles.payment",
        body: `The service fee is agreed at TRY {{feeAmount}}. Payment schedule: {{paymentSchedule}}.

For amounts unpaid within fifteen days of the invoice date, the Service Provider reserves the right to claim default interest and to suspend the services.`,
      },
      {
        key: "term",
        titleKey: "items.service.articles.term",
        body: `This agreement begins on {{startDate}} and ends on {{endDate}}. The term may be extended by written agreement of the parties.`,
      },
      {
        key: "termination",
        titleKey: "items.service.articles.termination",
        body: `Either party may terminate this agreement on thirty days' written notice. Services rendered up to the termination date are payable to the Service Provider. No notice period applies where the other party breaches its obligations and fails to remedy the breach within a reasonable period given to it.`,
      },
      {
        key: "liability",
        titleKey: "items.service.articles.liability",
        body: `The Service Provider shall perform the services with professional care. The Client shall provide the information, documents and access needed to perform the services in good time; the Service Provider is not responsible for delays caused by their absence.

Unless the law provides otherwise, each party's liability under this agreement is limited to the total fees paid under it.`,
      },
    ],
  },
};
