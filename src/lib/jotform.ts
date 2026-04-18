import type { JotformListResponse, JotformSubmission } from '../data/types';

const JOTFORM_BASE_URL = 'https://api.jotform.com';
const DEFAULT_LIMIT = 1000;

/** Transient error class so the UI layer can surface a friendly message. */
export class JotformApiError extends Error {
  public readonly status: number | undefined;
  public readonly formId: string;

  constructor(message: string, opts: { formId: string; status?: number | undefined }) {
    super(message);
    this.name = 'JotformApiError';
    this.formId = opts.formId;
    this.status = opts.status;
  }
}

function readApiKeys(): readonly string[] {
  const raw = import.meta.env.VITE_JOTFORM_API_KEYS ?? '';
  const keys = raw
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  return keys;
}

interface FetchOptions {
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

/**
 * Fetch all submissions for the given Jotform form.
 *
 * The client tries each configured API key in order; if a key fails with 401,
 * 403 or 429 it moves on to the next one. All other errors (or all keys
 * failing) surface as `JotformApiError`.
 */
export async function getSubmissions(
  formId: string,
  options: FetchOptions = {},
): Promise<readonly JotformSubmission[]> {
  const keys = readApiKeys();
  if (keys.length === 0) {
    throw new JotformApiError(
      'Missing VITE_JOTFORM_API_KEYS. Copy .env.example to .env.local and fill in a key.',
      { formId },
    );
  }

  const limit = options.limit ?? DEFAULT_LIMIT;
  let lastError: JotformApiError | undefined;

  for (const key of keys) {
    const url = new URL(`${JOTFORM_BASE_URL}/form/${formId}/submissions`);
    url.searchParams.set('apiKey', key);
    url.searchParams.set('limit', String(limit));

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        ...(options.signal ? { signal: options.signal } : {}),
      });

      if (response.status === 401 || response.status === 403 || response.status === 429) {
        lastError = new JotformApiError(
          `Jotform request rejected (status ${response.status}) for form ${formId}.`,
          { formId, status: response.status },
        );
        continue;
      }

      if (!response.ok) {
        throw new JotformApiError(
          `Jotform request failed (status ${response.status}) for form ${formId}.`,
          { formId, status: response.status },
        );
      }

      const payload = (await response.json()) as JotformListResponse;
      return payload.content ?? [];
    } catch (error) {
      if (error instanceof JotformApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      lastError = new JotformApiError(
        `Network error while fetching form ${formId}: ${(error as Error).message}`,
        { formId },
      );
    }
  }

  throw lastError ?? new JotformApiError(`All API keys failed for form ${formId}.`, { formId });
}
