import type { ContractTemplate } from "./types";

/**
 * İstifa / işten ayrılma belgesi. Karşılıklı bir sözleşme değil tek taraflı
 * bir beyandır; yine de `parties` maddesiyle başlar, çünkü imza bloğundaki
 * başlıklar (`Çalışan` / `İşveren`) bu satırlardan türetilir ve belgenin
 * işveren nüshası da imzalanır.
 *
 * Madde anahtarları `contract_types.section_keys` ('resignation') ile birebir.
 */
export const resignationTemplate: ContractTemplate = {
  id: "resignation",
  contractTypeCode: "resignation",
  category: "hr",
  nameKey: "items.resignation.name",
  descriptionKey: "items.resignation.description",
  version: 1,
  status: "active",
  titleField: "employeeName",
  fields: [
    {
      name: "employeeName",
      type: "text",
      group: "parties",
      labelKey: "items.resignation.fields.employeeName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "employeeId",
      type: "text",
      group: "parties",
      labelKey: "items.resignation.fields.employeeId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "employerName",
      type: "text",
      group: "parties",
      labelKey: "items.resignation.fields.employerName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "position",
      type: "text",
      group: "subject",
      labelKey: "items.resignation.fields.position.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "resignationDate",
      type: "date",
      group: "term",
      labelKey: "items.resignation.fields.resignationDate.label",
      required: true,
    },
    {
      name: "lastWorkingDay",
      type: "date",
      group: "term",
      labelKey: "items.resignation.fields.lastWorkingDay.label",
      required: true,
    },
    {
      name: "handoverNotes",
      type: "textarea",
      group: "other",
      labelKey: "items.resignation.fields.handoverNotes.label",
      placeholderKey: "items.resignation.fields.handoverNotes.placeholder",
      required: false,
      maxLength: 1200,
    },
    {
      name: "specialTerms",
      type: "textarea",
      group: "other",
      labelKey: "items.resignation.fields.specialTerms.label",
      required: false,
      maxLength: 1200,
    },
  ],
  content: {
    tr: [
      {
        key: "parties",
        titleKey: "items.resignation.articles.parties",
        body: `Çalışan: {{employeeName}}
T.C. Kimlik No: {{employeeId}}

İşveren: {{employerName}}`,
      },
      {
        key: "declaration",
        titleKey: "items.resignation.articles.declaration",
        body: `{{employerName}} nezdinde {{position}} pozisyonunda yürütmekte olduğum görevimden kendi isteğimle ayrılmak istiyorum. İşbu bildirimi {{resignationDate}} tarihinde sunuyorum.

Ayrılma kararım kendi irademle alınmıştır.`,
      },
      {
        key: "last_working_day",
        titleKey: "items.resignation.articles.last_working_day",
        body: `Son çalışma günüm {{lastWorkingDay}} tarihidir. Bu tarihe kadar yürürlükteki iş mevzuatından ve iş sözleşmemden doğan yükümlülüklerimi yerine getireceğim.`,
      },
      {
        key: "handover",
        titleKey: "items.resignation.articles.handover",
        body: `Son çalışma günüme kadar devredilecek işler, dosyalar ve zimmetimde bulunan eşyalar aşağıdaki gibidir:

{{handoverNotes}}

Devir teslim, İşveren'in belirleyeceği kişiye yazılı olarak yapılacaktır.`,
        omitWhenEmpty: "handoverNotes",
      },
      {
        key: "receivables",
        titleKey: "items.resignation.articles.receivables",
        body: `Son çalışma günü itibarıyla tahakkuk etmiş ücret, kullanılmayan yıllık izin ve varsa diğer alacaklarımın yürürlükteki mevzuata uygun biçimde ödenmesini talep ederim. İşbu bildirim, doğmuş ve doğacak yasal haklarımdan feragat ettiğim anlamına gelmez.`,
      },
      {
        key: "confidentiality",
        titleKey: "items.resignation.articles.confidentiality",
        body: `İş ilişkim süresince öğrendiğim ticari sır niteliğindeki bilgileri ve müşteri bilgilerini, iş ilişkisinin sona ermesinden sonra da üçüncü kişilerle paylaşmayacağımı beyan ederim.`,
      },
      {
        key: "special_terms",
        titleKey: "items.resignation.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
    en: [
      {
        key: "parties",
        titleKey: "items.resignation.articles.parties",
        body: `Employee: {{employeeName}}
ID No: {{employeeId}}

Employer: {{employerName}}`,
      },
      {
        key: "declaration",
        titleKey: "items.resignation.articles.declaration",
        body: `I wish to resign of my own accord from the position of {{position}} that I hold at {{employerName}}. I am submitting this notice on {{resignationDate}}.

This decision has been taken of my own free will.`,
      },
      {
        key: "last_working_day",
        titleKey: "items.resignation.articles.last_working_day",
        body: `My last working day is {{lastWorkingDay}}. Until that date I shall fulfil the obligations arising from applicable employment law and from my employment agreement.`,
      },
      {
        key: "handover",
        titleKey: "items.resignation.articles.handover",
        body: `The work, files and company property assigned to me that are to be handed over by my last working day are as follows:

{{handoverNotes}}

The handover will be made in writing to the person nominated by the Employer.`,
        omitWhenEmpty: "handoverNotes",
      },
      {
        key: "receivables",
        titleKey: "items.resignation.articles.receivables",
        body: `I request that salary accrued as at my last working day, unused annual leave and any other amounts owed to me be paid in accordance with applicable law. This notice does not mean that I waive any statutory rights that have arisen or may arise.`,
      },
      {
        key: "confidentiality",
        titleKey: "items.resignation.articles.confidentiality",
        body: `I confirm that I shall not share with third parties, including after the end of the employment, any trade secrets or customer information learned during my employment.`,
      },
      {
        key: "special_terms",
        titleKey: "items.resignation.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
  },
};
