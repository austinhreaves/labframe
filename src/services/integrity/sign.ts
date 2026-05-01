import { canonicalize } from '@/services/integrity/canonicalize';

type SignResponse = {
  signature: string;
  signedAt: number;
};

type SignErrorBody = {
  error?: string;
};

const NETWORK_ERROR_MESSAGE = 'Could not sign report (network issue). Try again.';

function toUserMessage(status: number, serverError?: string): string {
  if (status === 400) {
    return 'Could not sign report (invalid signing payload). Refresh and try again.';
  }
  if (status === 413) {
    return 'Could not sign report (payload too large). Reduce attachments and try again.';
  }
  if (status === 500) {
    return 'Could not sign report (server misconfigured). Contact support.';
  }
  if (serverError && serverError.trim()) {
    return `Could not sign report (${serverError}).`;
  }
  return `Could not sign report (unexpected server response: ${status}). Try again.`;
}

export async function signAnswers(answers: unknown): Promise<SignResponse> {
  const canonical = canonicalize(answers);

  let response: Response;
  try {
    response = await fetch('/api/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ canonical }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    let serverError: string | undefined;
    try {
      const errorPayload = (await response.json()) as SignErrorBody;
      if (typeof errorPayload.error === 'string') {
        serverError = errorPayload.error;
      }
    } catch {
      serverError = undefined;
    }
    throw new Error(toUserMessage(response.status, serverError));
  }

  const payload = (await response.json()) as Partial<SignResponse>;
  if (typeof payload.signature !== 'string' || typeof payload.signedAt !== 'number') {
    throw new Error('Could not sign report (invalid server payload). Try again.');
  }

  return {
    signature: payload.signature,
    signedAt: payload.signedAt,
  };
}
