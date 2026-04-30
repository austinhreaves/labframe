import { canonicalize } from '@/services/integrity/canonicalize';

type SignResponse = {
  signature: string;
  signedAt: number;
};

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
    throw new Error('Could not sign report (network issue). Try again.');
  }

  if (!response.ok) {
    throw new Error('Could not sign report (network issue). Try again.');
  }

  const payload = (await response.json()) as Partial<SignResponse>;
  if (typeof payload.signature !== 'string' || typeof payload.signedAt !== 'number') {
    throw new Error('Could not sign report (network issue). Try again.');
  }

  return {
    signature: payload.signature,
    signedAt: payload.signedAt,
  };
}
