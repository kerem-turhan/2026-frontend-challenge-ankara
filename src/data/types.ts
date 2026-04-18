/**
 * Domain types for the Missing Podo investigation dashboard.
 *
 * Two layers live here:
 * 1. The raw Jotform submission shape as returned by the public API.
 * 2. The normalized `BaseRecord` / `Person` shapes consumed by the UI.
 */

export type SourceType = 'checkin' | 'message' | 'sighting' | 'note' | 'tip';

/**
 * Jotform represents each question's answer under a dynamic key. The shape is
 * intentionally loose because different forms expose different field names.
 */
export interface JotformAnswer {
  readonly name?: string;
  readonly text?: string;
  readonly type?: string;
  readonly answer?: unknown;
  readonly prettyFormat?: string;
  readonly order?: string;
}

export interface JotformSubmission {
  readonly id: string;
  readonly form_id: string;
  readonly created_at: string;
  readonly updated_at?: string;
  readonly status?: string;
  readonly answers: Record<string, JotformAnswer>;
}

export interface JotformListResponse {
  readonly responseCode: number;
  readonly message?: string;
  readonly content: readonly JotformSubmission[];
  readonly resultSet?: {
    readonly offset: number;
    readonly limit: number;
    readonly count: number;
  };
}

/**
 * Unified record shape produced by per-source adapters. All UI queries, filters
 * and timeline renders operate on this flat structure.
 */
export interface BaseRecord {
  readonly id: string;
  readonly sourceType: SourceType;
  readonly occurredAt: string;
  readonly personName?: string;
  readonly otherPersonName?: string;
  readonly location?: string;
  readonly text?: string;
  readonly mentionsPodo: boolean;
  readonly raw: JotformSubmission;
}

/**
 * Aggregated view of a single person across every source.
 */
export interface Person {
  readonly key: string;
  readonly displayName: string;
  readonly records: readonly BaseRecord[];
  readonly latestSeenAt?: string;
  readonly lastLocation?: string;
  readonly otherPeople: readonly string[];
  readonly sourceCounts: Readonly<Record<SourceType, number>>;
  readonly mentionsPodoCount: number;
  readonly suspicionScore: number;
  readonly suspicionBreakdown: SuspicionBreakdown;
}

export interface SuspicionBreakdown {
  readonly sightingsWithPodo: number;
  readonly messagesWithPodo: number;
  readonly tipsAboutThem: number;
  readonly checkinsNearPodo: number;
  readonly notesWithPodo: number;
  readonly unrelatedPenalty: number;
}

export type InvestigationStatus = 'loading' | 'partial' | 'ready' | 'error';

export interface SourceStatus {
  readonly sourceType: SourceType;
  readonly state: 'loading' | 'success' | 'error';
  readonly error?: Error;
}
