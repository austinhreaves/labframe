export type StudentInfoFieldId = 'studentName';

export type StudentInfoInput = Partial<Record<StudentInfoFieldId, string>>;

type PreflightOk = {
  ok: true;
};

type PreflightFailure = {
  ok: false;
  missing: StudentInfoFieldId[];
};

const DEFAULT_REQUIRED_FIELDS: StudentInfoFieldId[] = ['studentName'];

function isMissingStudentName(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) {
    return true;
  }

  // "Student" is a legacy placeholder that should not pass PDF preflight.
  return value.trim().toLowerCase() === 'student';
}

export function validateStudentInfoForPdf(
  input: StudentInfoInput,
  requiredFields: StudentInfoFieldId[] = DEFAULT_REQUIRED_FIELDS,
): PreflightOk | PreflightFailure {
  const missing: StudentInfoFieldId[] = [];

  for (const fieldId of requiredFields) {
    if (fieldId === 'studentName' && isMissingStudentName(input.studentName)) {
      missing.push(fieldId);
    }
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true };
}
