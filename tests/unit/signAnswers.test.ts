import { afterEach, describe, expect, it, vi } from 'vitest';

import { signAnswers } from '@/services/integrity/sign';

function mockJsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('signAnswers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('maps network failures to retry message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('socket hang up')));

    await expect(signAnswers({ hello: 'world' })).rejects.toThrow('Could not sign report (network issue). Try again.');
  });

  it('maps 400 responses to invalid payload guidance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({ error: 'Invalid body' }, 400)));

    await expect(signAnswers({ hello: 'world' })).rejects.toThrow(
      'Could not sign report (invalid signing payload). Refresh and try again.',
    );
  });

  it('maps 413 responses to size guidance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({ error: 'Payload too large' }, 413)));

    await expect(signAnswers({ hello: 'world' })).rejects.toThrow(
      'Could not sign report (payload too large). Reduce attachments and try again.',
    );
  });

  it('maps 500 responses to server misconfiguration guidance', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockJsonResponse({ error: 'Server misconfigured' }, 500)));

    await expect(signAnswers({ hello: 'world' })).rejects.toThrow(
      'Could not sign report (server misconfigured). Contact support.',
    );
  });

  it('returns signature payload when server succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(mockJsonResponse({ signature: 'abcdef0123456789', signedAt: 1714450000000 }, 200)),
    );

    await expect(signAnswers({ hello: 'world' })).resolves.toEqual({
      signature: 'abcdef0123456789',
      signedAt: 1714450000000,
    });
  });
});
