type ParentMessageType = 'SAVE_PROGRESS' | 'SUBMIT_ANSWERS';

type EmbedConfig = {
  parentOriginAllowList?: string[];
  courseId?: string;
  labId?: string;
};

let allowList: string[] = [];
let activeCourseId: string | null = null;
let activeLabId: string | null = null;

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): string[] {
  return allowList.map((entry) => normalizeOrigin(entry)).filter((entry): entry is string => entry !== null);
}

function resolveTargetOrigin(): string | null {
  const allowed = allowedOrigins();
  if (allowed.length === 0 || typeof window === 'undefined') {
    return null;
  }

  const ancestorOrigins = window.location.ancestorOrigins;
  if (ancestorOrigins) {
    for (let index = 0; index < ancestorOrigins.length; index += 1) {
      const ancestorOrigin = ancestorOrigins.item(index);
      const origin = ancestorOrigin ? normalizeOrigin(ancestorOrigin) : null;
      if (origin && allowed.includes(origin)) {
        return origin;
      }
    }
  }

  const referrerOrigin = document.referrer ? normalizeOrigin(document.referrer) : null;
  if (referrerOrigin && allowed.includes(referrerOrigin)) {
    return referrerOrigin;
  }

  return null;
}

function postMessageToParent(type: ParentMessageType): void {
  if (typeof window === 'undefined' || window.parent === window) {
    return;
  }
  if (!activeCourseId || !activeLabId) {
    return;
  }
  const targetOrigin = resolveTargetOrigin();
  if (!targetOrigin) {
    return;
  }

  window.parent.postMessage(
    {
      type,
      courseId: activeCourseId,
      labId: activeLabId,
    },
    targetOrigin,
  );
}

export function configureParentMessaging(config: EmbedConfig): void {
  allowList = config.parentOriginAllowList ?? [];
  activeCourseId = config.courseId?.trim() || null;
  activeLabId = config.labId?.trim() || null;
}

export function clearParentMessagingContext(): void {
  activeCourseId = null;
  activeLabId = null;
}

export function postSaveProgressToParent(): void {
  postMessageToParent('SAVE_PROGRESS');
}

export function postSubmitAnswersToParent(): void {
  postMessageToParent('SUBMIT_ANSWERS');
}
