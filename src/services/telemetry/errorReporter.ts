type TelemetryPayload = {
  labId: string;
  sectionId?: string;
  message: string;
  stack?: string;
};

type TelemetryConfig = {
  telemetryEndpoint?: string;
  labId?: string;
};

let telemetryEndpoint: string | null = null;
let activeLabId: string | null = null;
let globalHandlersInstalled = false;

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return error.stack ? { message: error.message, stack: error.stack } : { message: error.message };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'Unknown error' };
}

export function configureTelemetry(config: TelemetryConfig): void {
  telemetryEndpoint = config.telemetryEndpoint?.trim() || null;
  activeLabId = config.labId?.trim() || null;
}

export function clearTelemetryContext(): void {
  activeLabId = null;
}

export async function reportError(options: { error: unknown; sectionId?: string; labId?: string }): Promise<boolean> {
  if (!telemetryEndpoint) {
    return false;
  }

  const labId = options.labId ?? activeLabId;
  if (!labId) {
    return false;
  }

  const normalized = normalizeError(options.error);
  const payload: TelemetryPayload = {
    labId,
    message: normalized.message,
    ...(options.sectionId ? { sectionId: options.sectionId } : {}),
    ...(normalized.stack ? { stack: normalized.stack } : {}),
  };

  try {
    await fetch(telemetryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function installGlobalTelemetryHandlers(): void {
  if (globalHandlersInstalled || typeof window === 'undefined') {
    return;
  }
  globalHandlersInstalled = true;

  window.addEventListener('error', (event) => {
    void reportError({ error: event.error ?? event.message });
  });

  window.addEventListener('unhandledrejection', (event) => {
    void reportError({ error: event.reason });
  });
}
