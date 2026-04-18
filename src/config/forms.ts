import type { SourceType } from '../data/types';

/**
 * Form configuration. These Jotform form IDs were shared as runtime data-access
 * context for the challenge and are consumed by `useInvestigation` in Step 2.
 */
export interface FormConfig {
  readonly sourceType: SourceType;
  readonly label: string;
  readonly formId: string;
}

export const FORMS: readonly FormConfig[] = [
  { sourceType: 'checkin', label: 'Check-ins', formId: '261065067494966' },
  { sourceType: 'message', label: 'Messages', formId: '261065765723966' },
  { sourceType: 'sighting', label: 'Sightings', formId: '261065244786967' },
  { sourceType: 'note', label: 'Personal Notes', formId: '261065509008958' },
  { sourceType: 'tip', label: 'Anonymous Tips', formId: '261065875889981' },
] as const;

export const FORM_BY_SOURCE: Readonly<Record<SourceType, FormConfig>> = Object.fromEntries(
  FORMS.map((form) => [form.sourceType, form]),
) as Record<SourceType, FormConfig>;
