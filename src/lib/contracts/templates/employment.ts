import type { ContractTemplate } from "./types";

/** İş sözleşmesi. Madde anahtarları `contract_types.section_keys` ('employment') ile birebir. */
export const employmentTemplate: ContractTemplate = {
  id: "employment",
  contractTypeCode: "employment",
  category: "employment",
  nameKey: "items.employment.name",
  descriptionKey: "items.employment.description",
  version: 1,
  status: "active",
  titleField: "employeeName",
  fields: [
    {
      name: "employerName",
      type: "text",
      group: "parties",
      labelKey: "items.employment.fields.employerName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "employerTaxNo",
      type: "text",
      group: "parties",
      labelKey: "items.employment.fields.employerTaxNo.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "employeeName",
      type: "text",
      group: "parties",
      labelKey: "items.employment.fields.employeeName.label",
      required: true,
      maxLength: 160,
    },
    {
      name: "employeeId",
      type: "text",
      group: "parties",
      labelKey: "items.employment.fields.employeeId.label",
      required: true,
      maxLength: 40,
    },
    {
      name: "position",
      type: "text",
      group: "subject",
      labelKey: "items.employment.fields.position.label",
      placeholderKey: "items.employment.fields.position.placeholder",
      required: true,
      maxLength: 160,
    },
    {
      name: "workMode",
      type: "select",
      group: "subject",
      labelKey: "items.employment.fields.workMode.label",
      required: true,
      defaultValue: "onsite",
      options: [
        { value: "onsite", labelKey: "items.employment.fields.workMode.options.onsite" },
        { value: "hybrid", labelKey: "items.employment.fields.workMode.options.hybrid" },
        { value: "remote", labelKey: "items.employment.fields.workMode.options.remote" },
      ],
    },
    {
      name: "workplaceAddress",
      type: "textarea",
      group: "subject",
      labelKey: "items.employment.fields.workplaceAddress.label",
      required: true,
      maxLength: 400,
    },
    {
      name: "salaryAmount",
      type: "number",
      group: "financial",
      labelKey: "items.employment.fields.salaryAmount.label",
      placeholderKey: "items.employment.fields.salaryAmount.placeholder",
      required: true,
    },
    {
      name: "startDate",
      type: "date",
      group: "term",
      labelKey: "items.employment.fields.startDate.label",
      required: true,
    },
    {
      name: "weeklyHours",
      type: "number",
      group: "term",
      labelKey: "items.employment.fields.weeklyHours.label",
      placeholderKey: "items.employment.fields.weeklyHours.placeholder",
      required: true,
      defaultValue: "45",
    },
    {
      name: "annualLeaveDays",
      type: "number",
      group: "term",
      labelKey: "items.employment.fields.annualLeaveDays.label",
      placeholderKey: "items.employment.fields.annualLeaveDays.placeholder",
      required: false,
    },
    {
      name: "specialTerms",
      type: "textarea",
      group: "other",
      labelKey: "items.employment.fields.specialTerms.label",
      required: false,
      maxLength: 2000,
    },
  ],
  content: {
    tr: [
      {
        key: "parties",
        titleKey: "items.employment.articles.parties",
        body: `İşveren: {{employerName}}
Vergi No: {{employerTaxNo}}

Çalışan: {{employeeName}}
T.C. Kimlik No: {{employeeId}}`,
      },
      {
        key: "position",
        titleKey: "items.employment.articles.position",
        body: `Çalışan, İşveren nezdinde {{position}} pozisyonunda görev yapacaktır. Çalışan, bu pozisyonun gerektirdiği işleri İşveren'in talimatlarına ve iş yerinde yürürlükte olan kurallara uygun biçimde yerine getirir.`,
      },
      {
        key: "start_date",
        titleKey: "items.employment.articles.start_date",
        body: `İş ilişkisi {{startDate}} tarihinde başlar. Sözleşme belirsiz sürelidir. Yasal deneme süresi içinde taraflar sözleşmeyi bildirim süresine uymaksızın feshedebilir.`,
      },
      {
        key: "salary",
        titleKey: "items.employment.articles.salary",
        body: `Çalışan'a aylık {{salaryAmount}} TL brüt ücret ödenir. Ücret, yasal kesintiler yapıldıktan sonra her ay Çalışan'ın banka hesabına yatırılır.`,
      },
      {
        key: "working_hours",
        titleKey: "items.employment.articles.working_hours",
        body: `Haftalık çalışma süresi {{weeklyHours}} saattir. Çalışma süresinin günlere dağılımı İşveren tarafından, yürürlükteki iş mevzuatının sınırları içinde belirlenir. Fazla çalışma yapılması hâlinde mevzuatın öngördüğü ücret veya serbest zaman uygulanır.`,
      },
      {
        key: "workplace",
        titleKey: "items.employment.articles.workplace",
        body: `Çalışma şekli: {{workMode}}.

Çalışma adresi: {{workplaceAddress}}

İşin niteliğinin gerektirdiği hâllerde İşveren, Çalışan'ın görev yerini iş mevzuatının izin verdiği ölçüde değiştirebilir.`,
      },
      {
        key: "leave",
        titleKey: "items.employment.articles.leave",
        body: `Çalışan, yürürlükteki mevzuatın öngördüğü yıllık ücretli izne hak kazanır. Taraflar, mevzuattaki asgari süreye ek olarak yılda {{annualLeaveDays}} gün izin uygulanmasında anlaşmıştır. İznin kullanılacağı dönem, işin gereklerine göre taraflarca birlikte belirlenir.`,
      },
      {
        key: "confidentiality",
        titleKey: "items.employment.articles.confidentiality",
        body: `Çalışan, iş ilişkisi süresince öğrendiği ticari sır niteliğindeki bilgileri, müşteri bilgilerini ve İşveren'in iş süreçlerine ilişkin verileri üçüncü kişilerle paylaşamaz. Bu yükümlülük iş ilişkisinin sona ermesinden sonra da devam eder.`,
      },
      {
        key: "termination",
        titleKey: "items.employment.articles.termination",
        body: `Sözleşme, yürürlükteki iş mevzuatında öngörülen bildirim sürelerine uyularak taraflardan her biri tarafından feshedilebilir. Haklı nedenle derhal fesih hakları saklıdır.`,
      },
      {
        key: "special_terms",
        titleKey: "items.employment.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
    en: [
      {
        key: "parties",
        titleKey: "items.employment.articles.parties",
        body: `Employer: {{employerName}}
Tax No: {{employerTaxNo}}

Employee: {{employeeName}}
ID No: {{employeeId}}`,
      },
      {
        key: "position",
        titleKey: "items.employment.articles.position",
        body: `The Employee shall work for the Employer in the position of {{position}}. The Employee shall carry out the duties of that position in line with the Employer's instructions and the rules in force at the workplace.`,
      },
      {
        key: "start_date",
        titleKey: "items.employment.articles.start_date",
        body: `The employment begins on {{startDate}}. The agreement is for an indefinite term. During the statutory probation period either party may terminate without observing a notice period.`,
      },
      {
        key: "salary",
        titleKey: "items.employment.articles.salary",
        body: `The Employee is paid a gross monthly salary of TRY {{salaryAmount}}. The salary is transferred to the Employee's bank account each month after statutory deductions.`,
      },
      {
        key: "working_hours",
        titleKey: "items.employment.articles.working_hours",
        body: `Weekly working time is {{weeklyHours}} hours. The distribution of working time across the week is set by the Employer within the limits of applicable employment law. Overtime is compensated by pay or time off as required by law.`,
      },
      {
        key: "workplace",
        titleKey: "items.employment.articles.workplace",
        body: `Work mode: {{workMode}}.

Workplace address: {{workplaceAddress}}

Where the nature of the work requires it, the Employer may change the Employee's place of work to the extent permitted by employment law.`,
      },
      {
        key: "leave",
        titleKey: "items.employment.articles.leave",
        body: `The Employee is entitled to paid annual leave as provided by applicable law. In addition to the statutory minimum, the parties have agreed on {{annualLeaveDays}} days of leave per year. The timing of leave is agreed between the parties according to operational needs.`,
      },
      {
        key: "confidentiality",
        titleKey: "items.employment.articles.confidentiality",
        body: `The Employee shall not disclose to third parties any trade secrets, customer information or data concerning the Employer's business processes learned during the employment. This obligation survives the end of the employment.`,
      },
      {
        key: "termination",
        titleKey: "items.employment.articles.termination",
        body: `Either party may terminate this agreement by observing the notice periods set out in applicable employment law. The right of immediate termination for just cause is reserved.`,
      },
      {
        key: "special_terms",
        titleKey: "items.employment.articles.special_terms",
        omitWhenEmpty: "specialTerms",
        body: `{{specialTerms}}`,
      },
    ],
  },
};
