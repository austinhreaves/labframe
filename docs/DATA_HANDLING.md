# LabFrame — Data Handling, Privacy, and FERPA Reference

**Document owner:** Austin Reaves, Instructional Professional, ASU Department of Physics
**Audience:** ASU IT Security, ASU IT Compliance, ASU Privacy Office, and any reviewing third party
**Document status:** Living document — kept current with the deployed application
**Last revised:** 2026-05-02
**Version:** 1.0 (matches LabFrame v1.0 launch)

---

## 1. Executive summary

LabFrame is an in-browser physics lab worksheet application built and operated by Austin Reaves/ASU Physics Instructional Resource Team. It is not a third-party SaaS vendor; it is an internally developed tool. Students complete lab worksheets in their browser, the application generates a tamper-evident PDF, and the student submits the PDF through Canvas using Canvas's standard assignment workflow.

The system is intentionally minimal in its data handling:

- **No central database.** No student records, no answers, no images, no progress tracking is persisted on any server LabFrame controls.
- **Browser-local storage only.** All in-progress work lives in the student's own browser (localStorage for JSON, IndexedDB for images). The student owns this data on their own device.
- **One serverless endpoint.** A single Vercel serverless function (`/api/sign`) accepts a JSON payload, computes an HMAC-SHA256 signature using a server-held secret, and returns the signature. It does not persist or log payload contents.
- **Submission via Canvas.** The signed PDF is uploaded by the student through Canvas's normal file picker. From that point, FERPA-protected handling is Canvas's responsibility under ASU's existing vendor agreement.

Personally identifiable information collected: student-typed name and (optionally, post-1.0) student ID. No SSN, no health data, no financial data, no protected attributes are collected. FERPA-protected education records exist in this system only transiently — during the request/response cycle of the signing endpoint and within the PDF the student themselves owns and submits.

The remainder of this document inventories every piece of data, traces every flow, and is honest about the items not yet shipped that affect this posture.

---

## 2. System overview

LabFrame is a single-page web application built in React + TypeScript with a single Vercel serverless function for signing. It is deployed at a URL under ASU control (currently `physics-labs.up.railway.app` for the legacy version; production URL for v1.0 to be confirmed). The source code is maintained internally and is available for review on request.

**Architecture in one paragraph:** A student opens LabFrame in a browser. The app loads from Vercel's CDN as a static bundle. The student selects a course, a lab, types their name, and works through the lab worksheet — answering questions, entering measurements, generating plots from data tables. Their work autosaves to their browser's localStorage every 250ms. When they finish, they click "Export PDF." The browser computes a canonical JSON representation of all answers, sends it to `/api/sign`, receives a signature back, embeds the signature and the canonical JSON inside a generated PDF, and triggers a browser download. The student then uploads that PDF through Canvas as their assignment submission.

The simulation iframe (PhET) is an external resource served by phet.colorado.edu; it does not exchange data with LabFrame and is not a data flow LabFrame controls.

---

## 3. Data inventory

The following table enumerates every category of data LabFrame handles, classifies it under FERPA and ASU policy, and identifies where it resides.

| Data category | Examples | Classification | Where it lives | Notes |
|---|---|---|---|---|
| Student name | "Austin Reaves" | FERPA directory information; PII | Browser localStorage; transmitted to `/api/sign`; in PDF | Typed by student; not authenticated |
| Student ID (optional, Phase 6.2) | 10-digit ASU ID | FERPA directory information; PII | Same as student name | Optional field; never required |
| Course identifier | "phy114" | Not personal | Browser localStorage; URL; in PDF | Public information |
| Lab identifier | "snellsLaw" | Not personal | Browser localStorage; URL; in PDF | Public information |
| Lab answers (free text) | Conclusions, calculations | FERPA education record once submitted | Browser localStorage; transmitted to `/api/sign`; in PDF | Student's intellectual work |
| Measurement data (numeric) | "30.0", "1.33" | FERPA education record once submitted | Same | |
| Image uploads | Photos of lab setup | FERPA education record once submitted | Browser IndexedDB; in PDF | Stored as Blob in IndexedDB to avoid localStorage size limits |
| Process telemetry | Paste events, keystroke counts, focus time per field | Behavioral data; PII when associated with name | Browser localStorage; transmitted to `/api/sign`; in PDF appendix | Disclosed to student in the integrity statement |
| Pasted text content | Verbatim text the student pasted into a field | Educational record + behavioral data | Same as process telemetry | May contain third-party content (e.g., from a chat tool) — captured for integrity disclosure |
| AI tool disclosure (Phase 5.5) | "Used Claude / ChatGPT", links to shared chats | Educational record once submitted | Same | Self-reported; included in canonical JSON and PDF |
| HMAC signature | 64-character hex string | Not personal | Computed server-side; in PDF | Cryptographic artifact; reveals nothing about the underlying data |
| Browser fingerprint, IP address | Implicit in any HTTP request | PII (IP); behavioral (UA) | NOT logged by LabFrame; standard Vercel edge metrics may capture | Vercel's standard request logging applies; LabFrame does not access it |

**What LabFrame does NOT collect:**

- Social security numbers
- Health or disability information (beyond what a student may voluntarily mention in a free-text answer)
- Financial information
- Protected demographic attributes (race, religion, sexual orientation, etc.)
- Authentication credentials (LabFrame does not authenticate; see §7)
- Persistent user identifiers across sessions (no cookies set by LabFrame)
- Cross-site tracking data
- Third-party analytics (no Google Analytics, no Mixpanel, no Sentry by default; opt-in error reporting in Phase 5 is configured per-deployment)

---

## 4. Data flows

This section traces every flow data takes through the system.

### 4.1 Student → browser

When a student loads LabFrame, they receive the static JS/CSS/HTML bundle from Vercel's CDN. No data flows from the student to a server at this point. The student then types their name and answers into the page. All input is captured by JavaScript running in the browser and held in component state plus a Zustand store.

### 4.2 Browser → browser storage (autosave)

Every 250ms (debounced), the browser writes the current state to its own storage:

- **localStorage** (synchronous, ~5MB cap per origin, plain-text JSON): keyed `lab:{courseId}:{labId}:{studentName}` for the JSON metadata of a lab in progress.
- **IndexedDB** (asynchronous, larger capacity): keyed `img:{courseId}:{labId}:{studentName}:{imageId}` for image Blobs.

This data lives entirely on the student's device. LabFrame's server has no access to it. A student switching browsers or clearing browser data loses their work; this is a known trade-off and is disclosed to the student.

### 4.3 Browser → `/api/sign` (signing request)

When the student clicks "Export PDF," the browser:

1. Computes a canonical JSON representation of all answers (deterministic — same inputs always produce the same bytes).
2. POSTs the canonical JSON to `/api/sign` over HTTPS (TLS 1.2+).
3. Receives back `{signature: string, signedAt: number}`.

The canonical JSON includes everything in the data inventory above except images (which are referenced by IndexedDB key, not embedded in the canonical bytes — the image bytes are embedded into the PDF separately).

**Endpoint behavior:** `/api/sign` is a stateless Node.js function deployed on Vercel. On receiving a request, it:

- Validates the request is a POST with a JSON body ≤ 5 MB.
- Reads the `LAB_SIGNING_SECRET` from Vercel environment variables.
- Computes `HMAC-SHA256(canonical || signedAt)` where `signedAt = Date.now()` (server clock).
- Returns the signature and `signedAt` as JSON.

**What the endpoint logs:** The endpoint logs only metadata: payload byte length, the first 8 hex characters of the signature (used to disambiguate concurrent requests in support tickets), the server timestamp, and on error paths a generic reason code (e.g., `payload_too_large`, `invalid_method`). The endpoint **does not log payload contents.** This is enforced in code; see Appendix A for the file:line citation.

**What the endpoint does NOT do:**

- Persist any data to disk, database, or external service.
- Forward the payload anywhere.
- Read or log identifiers (student name, ID) from the body.
- Set cookies or session state.
- Authenticate the caller (the endpoint is unauthenticated; see §7).

### 4.4 `/api/sign` → Vercel infrastructure logs

Vercel's standard request-level metrics apply: HTTP method, path, status code, response time, and the requesting IP address are visible to LabFrame's Vercel project owner in the Vercel dashboard. Body contents are not in those logs. Retention is per Vercel's plan (currently 7 days for log lines, longer for aggregated metrics). This is the same data Vercel collects for any application deployed to it.

### 4.5 Browser → student-downloaded PDF

After receiving the signature, the browser:

1. Renders a PDF locally using `@react-pdf/renderer` (no server involvement).
2. Embeds the canonical JSON as a file attachment inside the PDF using `pdf-lib`.
3. Stamps the signature in the PDF metadata and a visible footer.
4. Triggers a download via a Blob URL — the file is written to the student's chosen Downloads folder.

The PDF is a complete, self-contained record of the student's submission. It contains everything in the data inventory.

### 4.6 Student → Canvas (submission)

The student uploads the PDF to Canvas using Canvas's standard assignment submission flow. From this point, FERPA-protected handling is Canvas's responsibility under ASU's existing vendor agreement with Instructure. LabFrame is not in the data path.

### 4.7 No other flows

LabFrame does not transmit data to any third party, does not embed third-party trackers, and does not call out to any external service except the PhET simulation iframe (which is a one-way load of a static HTML5 application from `phet.colorado.edu`; PhET does not receive student data from LabFrame).

---

## 5. Storage and retention

| Storage location | Data | Retention | Controlled by |
|---|---|---|---|
| Browser localStorage | Lab metadata JSON | Indefinite, until student clears browser data or "Start fresh" | Student |
| Browser IndexedDB | Image blobs | Indefinite, until student clears browser data or "Start fresh" | Student |
| Vercel function memory | Canonical JSON during request | Duration of the HTTP request only (typically <100ms); discarded on response | Vercel/LabFrame |
| Vercel function logs | Metadata only (length, sig prefix, timestamp, error code) | 7 days (per Vercel plan) | Vercel |
| Vercel infrastructure logs | HTTP method/path/status/IP | 7 days (per Vercel plan) | Vercel |
| Student-downloaded PDF | Full submission record | Indefinite, until student deletes the file | Student |
| Canvas | Submitted PDF | Per ASU/Canvas data retention policy | Canvas/ASU |

**LabFrame does not maintain any backups of student data.** Any "backup" is the student's own copy: their localStorage, their downloaded PDF, or their Canvas submission. If the Vercel deployment is destroyed tomorrow, no student data is lost from a LabFrame-controlled location because LabFrame doesn't have a controlled location to hold it.

**Right-to-delete:** A student can clear their own browser data at any time (browser settings, or LabFrame's "Start fresh" button per-lab). LabFrame has no server-side data to delete on a student's behalf because LabFrame holds no server-side data.

---

## 6. Encryption

| Surface | Encryption status |
|---|---|
| Data in transit (browser ↔ Vercel) | TLS 1.2+ (HTTPS-only; HTTP requests redirect to HTTPS) |
| Data at rest in browser localStorage | Not encrypted by the application; relies on OS disk encryption (BitLocker/FileVault) |
| Data at rest in browser IndexedDB | Same as localStorage |
| Data at rest in Vercel function memory | Not at rest — held in RAM only during the request lifecycle |
| `LAB_SIGNING_SECRET` at rest | Encrypted in Vercel's environment variable storage (Vercel uses AES-256 for secrets) |
| Signed PDF | Not encrypted; the signature provides integrity, not confidentiality |
| Canvas-stored PDF | Per Canvas's encryption policy (TLS in transit; encrypted at rest per Instructure documentation) |

LabFrame does not implement application-level encryption beyond HMAC-based integrity. Confidentiality of student work in the browser depends on the security of the student's device. This is a deliberate scope choice: encrypting browser-local data with a key the student doesn't manage adds no real protection (the key has to live in the same device anyway), and adds significant UX cost.

---

## 7. Authentication and identity

**LabFrame v1.0 does not authenticate users.** Identity is "type your name into the field." The implications:

- A student who mistypes their name will produce a PDF with the wrong name in metadata and filename.
- A student could intentionally type someone else's name. The PDF signature does not bind to identity — it binds to content.
- There is no mechanism to enforce that the named student actually completed the work. This is by design, deferred to Canvas/Turnitin and instructor judgment.

**LTI 1.3 / OIDC integration is planned for a future phase but not in v1.0.** When implemented, LabFrame embedded in a Canvas iframe will read `lis_person_name_full` and `custom_canvas_user_id` from the LTI launch parameters (passed via `postMessage` from the parent Canvas window), prefilling the student name and binding identity to the Canvas account. This requires going through ASU IT to register a developer key with Canvas — a process not yet started.

**`postMessage` security:** When LabFrame is embedded in an iframe (any parent), it currently does not exchange messages with the parent. A planned feature (Phase 5) introduces an allow-list of parent origins per course manifest (e.g., `https://canvas.asu.edu` for PHY 114) so that any postMessage exchange is scoped to known origins. Until that ships, LabFrame in iframe mode is read-only from the parent's perspective.

---

## 8. FERPA compliance posture

FERPA (Family Educational Rights and Privacy Act, 20 U.S.C. § 1232g) protects "education records" — documents directly related to a student and maintained by an educational institution. The relevant analysis for LabFrame:

**1. Is LabFrame a "school official" under FERPA?**

Yes — LabFrame is an internally developed tool operated by ASU faculty (Austin Reaves) within the Department of Physics. It is not a third-party vendor. ASU faculty operating tools as part of their official duties are school officials under the FERPA legitimate-educational-interest exception (34 CFR § 99.31(a)(1)).

**2. What FERPA-protected records does LabFrame hold?**

LabFrame holds protected records only **transiently**:

- During the request/response cycle of `/api/sign` (canonical JSON in function memory for ~100ms).
- In Vercel infrastructure logs (HTTP method/path/status/IP for 7 days; no body content).

LabFrame does **not** hold protected records persistently on any server it controls. Persistent records exist only:

- On the student's own device (browser storage; not a FERPA-regulated location since the student owns the device).
- In the PDF the student themselves downloads and submits (the student owns this artifact at the moment of download).
- In Canvas after submission (Canvas's responsibility under ASU's vendor agreement).

**3. Is consent required?**

No specific FERPA consent is required because:

- Student name is FERPA-defined directory information (34 CFR § 99.3), unless a student has elected to suppress directory information through ASU's standard process.
- Lab work product is an education record but is created by the student themselves and submitted by the student through Canvas's normal workflow — the student is the originator and submitter, not a third party.
- LabFrame's collection of process telemetry (paste events, keystroke counts) is disclosed to students in the integrity statement they read before completing the lab.

**4. What about students who have suppressed directory information?**

These students should still be able to use LabFrame (no functionality is gated on identity verification). The PDF they generate carries their name as they type it; if they need their name suppressed in the submitted artifact, they can use a pseudonym agreed with the instructor — Canvas's identity is still authoritative for grading.

**5. Disclosure to others?**

LabFrame does not disclose any student data to any party other than:

- The student themselves (via the downloaded PDF).
- ASU instructors and TAs (via Canvas, after the student submits).

No third-party disclosure occurs.

**6. Annual notification?**

ASU's annual FERPA notification covers internally developed instructional tools by default. LabFrame is consistent with that notification.

---

## 9. ADA / accessibility posture

LabFrame v1.0 targets **WCAG 2.1 AA** compliance. Specifics:

- Keyboard navigation supported throughout (no mouse-only flows).
- Screen reader compatible (semantic HTML, ARIA labels on all inputs, `aria-live` regions for save status and modal dialogs).
- Focus management on modal dialogs (focus trap, ESC closes, focus returns to trigger).
- Color contrast meets WCAG AA in both light and dark themes.
- No paste blocking, no copy blocking, no context-menu interception (the legacy application used these; v1.0 explicitly does not, because they break assistive technology).
- Mathlive equation editor exposes accessible math rendering for screen readers.
- The PhET simulation iframe is accessible per PhET's own accessibility work; LabFrame does not introduce additional barriers.

**Remaining gaps as of v1.0:**

- Mobile/narrow-viewport layout is not optimized; small-screen users will need to use a larger device for the simulation portion. The PhET simulations themselves are not usable below ~768px wide regardless of LabFrame's layout.
- PDFs are not tagged for screen-reader accessibility. The signed canonical JSON attachment provides an alternative machine-readable representation of all data, but this is not a substitute for tagged PDF if a student or grader uses a PDF screen reader.

These gaps are documented and scheduled for post-1.0 work.

---

## 10. Risk areas and mitigations

This section enumerates the security and privacy risks LabFrame's design accepts, with mitigations.

### 10.1 Browser-local storage on shared devices

**Risk:** A student uses a public/shared computer (library, classroom), enters their name and lab work, and forgets to clear the browser. The next user could read or modify the prior student's work.

**Mitigation:** LabFrame displays an explicit "Saved in this browser only" warning next to the autosave indicator. The "Start fresh" button per-lab clears that lab's storage. Students are advised to use private/incognito mode on shared devices.

**Residual risk:** Low. Worst case is exposure of in-progress lab work (not submitted assignments, which live in Canvas). No financial or sensitive PII is at risk.

### 10.2 Signing endpoint secret compromise

**Risk:** If `LAB_SIGNING_SECRET` leaks (Vercel breach, accidental commit, insider access), an attacker can produce signatures indistinguishable from legitimate ones. Forged PDFs would pass any verification check.

**Mitigation:** The secret is stored in Vercel's environment variable storage (encrypted at rest), never appears in the client-side bundle, never appears in source control. Only Austin Reaves and designated ASU IT personnel have Vercel project access. Rotation procedure is documented (see §11). On suspected compromise, the secret is rotated and all PDFs signed during the suspect window are flagged for re-verification.

**Residual risk:** Low. Vercel maintains SOC 2 Type II compliance.

### 10.3 PDF tampering after signing

**Risk:** A student edits a signed PDF in Acrobat (changes a measurement value, changes their name) and submits the modified PDF.

**Mitigation:** The signature in the PDF metadata is over the canonical JSON. Any modification to the canonical JSON (also embedded in the PDF as a file attachment) invalidates the signature. A verification endpoint (planned post-1.0) lets a TA paste in a PDF and confirm whether the signature matches the contents. Without that endpoint, manual verification is possible by extracting the canonical JSON, recomputing the HMAC against the secret, and comparing.

**Residual risk:** Low for casual tampering; moderate for motivated tampering until the verification endpoint ships and is integrated into the TA workflow.

### 10.4 Signature replay / forgery via re-signing

**Risk:** A motivated attacker could intercept a legitimate POST to `/api/sign`, modify the canonical JSON, re-POST, and get a fresh signature. The result is a "validly signed" PDF with attacker-chosen contents.

**Mitigation:** Acknowledged in design (REBUILD_SPEC.md §5.14). The mitigation is nonce binding (server issues a one-time token bound to studentName/labId/sessionId; signatures only valid against the issued nonce) — deferred to v1.1. v1.0 ships without this; the threat model assumes that students with the technical ability to intercept and re-POST their own request also have the ability to study harder, and that this attack vector is not the cheating modality LabFrame primarily defends against.

**Residual risk:** Moderate, by design choice. If detected as a real cheating problem, nonce binding is the defined remediation.

### 10.5 Embedded in untrusted parent frame

**Risk:** LabFrame embedded in an iframe by a malicious parent could be subject to clickjacking or postMessage-based data exfiltration if LabFrame ever sends messages to the parent.

**Mitigation:** v1.0 does not exchange postMessage with parent frames. The planned LTI integration (post-1.0) will validate parent origins against a per-course allow-list before any message exchange. Additionally, a `Content-Security-Policy: frame-ancestors` header is set on LabFrame responses to restrict embedding to known origins (currently `https://canvas.asu.edu` and `self`).

**Residual risk:** Low.

### 10.6 Loss of work due to browser data clearing

**Risk:** Student clears browser data (intentionally or via OS update / browser reinstall) and loses in-progress lab work.

**Mitigation:** Student is informed via the "Saved in this browser only" warning. "Save draft" feature (post-1.0) lets a student export an unsigned PDF as a backup at any time. PDF is the canonical form of long-term storage; localStorage is for in-session resume only.

**Residual risk:** Low; impacts UX, not data integrity.

### 10.7 Dependency supply chain

**Risk:** A malicious update to an npm dependency could exfiltrate student data or compromise the signing endpoint.

**Mitigation:** Dependencies are pinned in `package-lock.json`. `npm audit` is run as part of CI. Dependabot (or equivalent) configured for security advisories. Major version updates require code review.

**Residual risk:** Industry-standard exposure. No more or less than any other Node.js application.

### 10.8 No penetration test

**Risk:** Application has not been independently security-tested.

**Mitigation:** Source code is available for review by ASU IT Security at any time. The attack surface is small (one POST endpoint, one static frontend) and the data-handling minimalism limits the blast radius of any vulnerability. A penetration test is recommended before broad rollout beyond a pilot cohort.

**Residual risk:** Unknown until tested. Worth scheduling.

---

## 11. Operational practices

### 11.1 Secret management

`LAB_SIGNING_SECRET` is a 32-byte (256-bit) random value stored in Vercel environment variables. It is never logged, never appears in source control, never sent to the client. Rotation procedure:

1. Generate new secret: `openssl rand -hex 32`.
2. Set new value in Vercel environment variables (Production environment).
3. Trigger redeploy.
4. After redeploy is live, mark the rotation timestamp; PDFs signed before this point should still verify against the old secret if any verification flow is in place.

Recommended rotation cadence: annually, or on any suspected compromise.

### 11.2 Deployment

Deployments are managed through Vercel's GitHub integration. Pushes to `main` trigger production deployments. Pull requests trigger preview deployments at unique URLs (preview deployments use a separate signing secret and are not used for graded work).

### 11.3 Access control

Vercel project access is limited to:

- Austin Reaves (project owner)
- Designated ASU IT personnel as required
- No third-party contractors as of v1.0

GitHub repository access follows ASU IPL standard practice: read access for collaborators, write access for committers, admin access for the project owner.

### 11.4 Incident response

In the event of a suspected data breach, signing-secret compromise, or other security incident:

**Immediate (within 1 hour):**
- Rotate `LAB_SIGNING_SECRET` per §11.1.
- Notify Austin Reaves and ASU IT Security.
- If signing endpoint compromise: take the endpoint offline (set `LAB_SIGNING_SECRET` to empty so the function returns 500). Students will see "Could not sign report" errors but no further compromised PDFs can be produced.

**Within 24 hours:**
- Determine the affected window (logs from Vercel can establish request volumes, source IPs).
- Notify ASU Privacy Office if FERPA-protected data may have been exposed.
- Identify affected students via Canvas submission logs cross-referenced with the affected window.
- Communicate with affected students per ASU policy.

**Post-incident:**
- Root cause analysis.
- Update this document with lessons learned.
- Update `REBUILD_SPEC.md` if architectural changes are warranted.

### 11.5 Contact

- **Project owner:** Austin Reaves, Instructional Professional, ASU Department of Physics
- **Email:** [Austin's ASU email — to be filled in by Austin]
- **Backup contact:** [TBD — likely an ASU IPL faculty colleague]
- **Source code:** [internal repository URL — to be filled in]

---

## 12. Pending items affecting this posture

The following items are planned but not implemented as of LabFrame v1.0. Each is called out because it materially affects the data handling story.

| Item | Affects | Status | Spec reference |
|---|---|---|---|
| `postMessage` parent-origin allow-list | Iframe embedding security | Planned for Phase 5 | REBUILD_SPEC.md §5.6, Phase 5 |
| LTI 1.3 / OIDC integration | Authenticated identity from Canvas | Future phase, not yet scheduled | Phase 6+ |
| AI usage disclosure on integrity statement | Captures and signs student-reported AI tool usage | Phase 5.5 | REBUILD_SPEC.md Phase 5.5 |
| Optional student ID field | Disambiguates students with shared names | Phase 6.2 | REBUILD_SPEC.md Phase 6.2 |
| Verification endpoint (`/api/verify`) | TA-facing tamper detection | Future phase | REBUILD_SPEC.md §9 |
| Signing nonce binding | Closes signature replay attack | v1.1 | REBUILD_SPEC.md §5.14 |
| Penetration test | Independent security validation | Recommended pre-broad-rollout | This document §10.8 |
| WCAG 2.1 AA verification (axe-core, Lighthouse in CI) | Accessibility compliance | Phase 5 | REBUILD_SPEC.md Phase 5 |
| Tagged PDFs for screen reader accessibility | PDF a11y | Future phase | This document §9 |
| Telemetry endpoint (opt-in error reporting) | Operational observability | Phase 5; off by default | REBUILD_SPEC.md Phase 5 |

---

## Appendix A: Technical reference

### A.1 Endpoints

LabFrame deploys a single backend endpoint:

- **`POST /api/sign`** — accepts JSON `{canonical: string}`, returns `{signature: string, signedAt: number}`. Validates payload ≤ 5 MB. Rejects non-POST methods with 405. Rejects oversized payloads with 413. Rejects malformed JSON with 400.

No other endpoints exist. There is no `/api/log`, `/api/track`, `/api/save`, or any other backend route.

### A.2 Source files of interest for review

| File | Purpose |
|---|---|
| `api/sign.ts` | Signing endpoint implementation; verify the "no-payload-logging" claim here |
| `src/services/integrity/sign.ts` | Client-side signing call wrapper |
| `src/services/integrity/canonicalize.ts` | Deterministic canonical JSON serialization |
| `src/state/persistence/labPersistenceMiddleware.ts` | Browser storage layer (localStorage + IndexedDB) |
| `src/state/persistence/idb.ts` | IndexedDB blob adapter |
| `src/state/labStore.ts` | Application state store |
| `src/services/pdf/Document.tsx` | PDF rendering |
| `src/services/pdf/seal.ts` | Signature stamping into the PDF |
| `REBUILD_SPEC.md` §5.13, §5.14 | Process telemetry and signing service design rationale |

### A.3 Specific verification: payload-logging claim

The claim that `/api/sign` does not log payload contents was audited on 2026-05-02. Findings:

- Only two log statements in `api/sign.ts`:
  - `console.warn` on rejection paths logs the HTTP status and a generic reason code only (e.g., `'invalid_method'`, `'payload_too_large'`).
  - `console.log` on success logs only the payload byte length, the first 8 hex characters of the computed signature, and the `signedAt` timestamp.
- Comment at `api/sign.ts` line 63: `// NEVER log canonical content`
- No file system writes, no external HTTP calls, no observability framework integrations.

This audit should be re-run before any future production deployment to ensure no logging has been added.

### A.4 Vercel project metadata

- **Hosting region:** US East (default; can be reconfigured)
- **Function runtime:** Node.js 22.x
- **Function memory:** 1024 MB (default)
- **Function max duration:** 10 seconds (well above the typical signing time of <100ms)
- **Edge caching:** Static assets cached at edge; `/api/sign` not cached (POST only)

### A.5 Glossary

- **HMAC-SHA256:** Hash-based Message Authentication Code using SHA-256 as the underlying hash function. A keyed cryptographic hash that produces a 256-bit signature; verifying the signature requires the same key used to compute it.
- **Canonical JSON:** A deterministic serialization of a JSON object — same logical content always produces the same byte string, regardless of key order or whitespace.
- **`pdf-lib`:** Open-source JavaScript library for PDF manipulation; used to embed file attachments and metadata into the PDF after `@react-pdf/renderer` produces the initial bytes.
- **`@react-pdf/renderer`:** Open-source library for rendering React components to PDF byte buffers; runs entirely in the browser, no server involvement.
- **PhET:** Physics Education Technology project at the University of Colorado Boulder; provides the HTML5 simulations LabFrame embeds via iframe.
- **LTI:** Learning Tools Interoperability; the IMS Global standard for integrating tools into learning management systems like Canvas.
- **Vercel:** The hosting platform LabFrame is deployed to. Provides static hosting + serverless functions.
- **Zustand:** The client-side state management library used in LabFrame.
- **IndexedDB:** Browser-native key-value database for storing larger structured data than localStorage allows, including binary blobs (used here for image uploads).

---

*End of document.*
