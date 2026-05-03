import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearTelemetryContext, configureTelemetry, reportError } from '@/services/telemetry/errorReporter';

describe('telemetry errorReporter', () => {
  beforeEach(() => {
    configureTelemetry({});
    clearTelemetryContext();
    vi.restoreAllMocks();
  });

  it('does nothing when telemetry endpoint is not configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const sent = await reportError({ error: new Error('boom'), labId: 'snellsLaw' });
    expect(sent).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the allowed payload when telemetry is enabled', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    configureTelemetry({
      telemetryEndpoint: 'https://telemetry.example.com/ingest',
      labId: 'snellsLaw',
    });

    const sent = await reportError({
      error: new Error('plot failed'),
      sectionId: 'plot-1',
    });

    expect(sent).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call as [RequestInfo | URL, RequestInit | undefined];
    expect(url).toBe('https://telemetry.example.com/ingest');
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
    expect(typeof init?.body).toBe('string');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      labId: 'snellsLaw',
      sectionId: 'plot-1',
      message: 'plot failed',
    });
  });
});
