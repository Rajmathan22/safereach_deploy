export type TermsSection = {
  id: string;
  title: string;
  body: string;
};

export type TermsState = {
  version: string;
  updatedAt: string;
  updatedBy: string;
  sections: TermsSection[];
};

export const TERMS_STORAGE_KEY = 'safereach_terms_conditions';

export const defaultTermsState: TermsState = {
  version: 'SafeReach Terms v1.0',
  updatedAt: 'Default frontend policy',
  updatedBy: 'SafeReach Main Admin',
  sections: [
    {
      id: 'app-purpose',
      title: 'SafeReach App Details',
      body:
        'SafeReach is a school safety, attendance, student travel status, incident reporting, parent communication, and operational monitoring application. The school or college registration request creates a SafeReach institution environment for approved school administrators, college administrators, teachers, parents, and authorized users.',
    },
    {
      id: 'data-collected',
      title: 'Data And Information Collected',
      body:
        'SafeReach may collect school details, administrator details, staff records, student records, parent or guardian contact details, class and section information, attendance records, student travel status, safety reports, incident logs, app messages, SMS delivery information, profile images, audit activity, and support requests needed to operate the service.',
    },
    {
      id: 'data-use',
      title: 'How Data Is Used',
      body:
        'Data is used to verify authorized users, manage school workspaces, display current school information, support attendance and travel updates, send safety and absence alerts, prepare reports, assist support teams, improve service quality, and maintain audit records. SafeReach does not sell student or child data.',
    },
    {
      id: 'student-data',
      title: 'Student And Child Data Protection',
      body:
        'Student information must be entered only by authorized school users and used only for school safety, attendance, communication, and approved administrative needs. Schools are responsible for confirming that parent, guardian, and institutional permissions are collected before using student data in SafeReach.',
    },
    {
      id: 'privacy-rights',
      title: 'Privacy Rights And Requests',
      body:
        'SafeReach is planned to support privacy rights such as access, correction, deletion, export, restriction, and objection requests where applicable under privacy laws including GDPR and CCPA. Requests should be handled through the school administrator or SafeReach support according to the user role and school policy.',
    },
    {
      id: 'sensitive-data',
      title: 'Sensitive And Health-Related Information',
      body:
        'SafeReach may show limited safety or medical emergency information only when the school provides it for operational safety. The product should be configured carefully if a school or partner has HIPAA-related obligations. SafeReach terms do not replace a separate healthcare, business associate, or institutional compliance agreement when one is legally required.',
    },
    {
      id: 'security',
      title: 'Data Security Commitment',
      body:
        'SafeReach commits to role-based access, protected user sessions, careful handling of personal information, operational monitoring, activity auditing, backup and recovery planning, and controlled administrator access. Internal security designs, algorithms, keys, and protective methods are intentionally not displayed inside public terms.',
    },
    {
      id: 'communications',
      title: 'SMS, Email, And App Communications',
      body:
        'Users may receive app messages, email alerts, and SMS notifications for attendance, travel status, absence, emergency, approval, support, and school or campus safety events. Standard mobile carrier charges may apply. SMS fallback is included for parents or guardians who may not use a smartphone.',
    },
    {
      id: 'user-responsibility',
      title: 'User Responsibilities',
      body:
        'Users must provide accurate information, protect their login access, use SafeReach only for authorized school purposes, avoid sharing another person\'s account, and immediately report suspected misuse, incorrect data, or unauthorized access.',
    },
    {
      id: 'retention',
      title: 'Retention, Audit, And Deletion',
      body:
        'SafeReach may retain records for school operations, safety review, audit trails, legal obligations, support, and dispute handling. Data should be deleted, archived, or anonymized when it is no longer needed, subject to school policy and applicable legal requirements.',
    },
    {
      id: 'changes',
      title: 'Changes To Terms',
      body:
        'The SafeReach main admin can update these terms for the frontend demo. Schools and users should review the current terms before registration and continued use. Future backend implementation should store accepted policy versions and consent audit history.',
    },
  ],
};

export function readTermsState(): TermsState {
  if (typeof window === 'undefined') return defaultTermsState;

  try {
    const stored = window.localStorage.getItem(TERMS_STORAGE_KEY);
    if (!stored) return defaultTermsState;
    const parsed = JSON.parse(stored) as Partial<TermsState>;
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
      return defaultTermsState;
    }

    return {
      version: parsed.version || defaultTermsState.version,
      updatedAt: parsed.updatedAt || defaultTermsState.updatedAt,
      updatedBy: parsed.updatedBy || defaultTermsState.updatedBy,
      sections: parsed.sections.map((section, index) => ({
        id: section.id || `custom-${index}`,
        title: section.title || `Section ${index + 1}`,
        body: section.body || '',
      })),
    };
  } catch {
    return defaultTermsState;
  }
}

export function saveTermsState(terms: TermsState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms));
}

export function termsSummary(terms: TermsState) {
  return `${terms.version} - ${terms.sections.length} policy sections`;
}
