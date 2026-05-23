import type { Lab } from '@/domain/schema';

export const DEFAULT_INTEGRITY_AGREEMENT_TEXT =
  'I affirm this submission reflects my own work. If AI or LLM tools — chatbots, large language models, or generative AI assistants such as ChatGPT, Claude, Gemini, Copilot, or any similar tool — were used in any part of this lab, the chats are disclosed and share links are provided below (required by course policy).';

export function resolveIntegrityAgreementText(lab: Lab): string {
  return lab.studentInfo?.integrityAgreementText ?? DEFAULT_INTEGRITY_AGREEMENT_TEXT;
}
