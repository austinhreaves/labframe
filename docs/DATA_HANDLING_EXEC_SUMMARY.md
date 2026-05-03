# LabFrame — Data Handling Executive Summary

**For:** ASU leadership, deans, VPs, and decision-makers reviewing LabFrame for departmental or institutional approval
**From:** Austin Reaves, Instructional Professional, ASU Department of Physics (Interactive Physics Labs)
**Date:** 2026-05-02 | **Status:** v1.0 launch posture

---

## What LabFrame is

A web-based lab worksheet tool built and operated internally by ASU faculty for fully-online physics lab courses. Students use it in their browser to complete lab reports for PHY 114 and the general physics catalog. They generate a tamper-evident PDF and submit it through Canvas using Canvas's normal assignment flow.

LabFrame is **not a third-party SaaS vendor**. It is an internally developed instructional tool, comparable to a faculty-built website or course resource. No external company has access to student data through LabFrame.

## How student data is handled

The data-handling design is intentionally minimal:

- **No central database.** LabFrame does not maintain a server-side database of student work, names, IDs, or progress. Nothing accumulates over time on a server LabFrame controls.
- **Browser-local storage.** Lab work in progress lives only in the student's own browser, on their own device.
- **One transient server call.** When a student clicks "Export PDF," the browser sends the lab data to a small server function that computes a tamper-evident signature and immediately discards the data. The function never stores or logs the contents.
- **Submission via Canvas.** The student downloads their PDF and submits it through Canvas. From that point, FERPA-protected handling is Canvas's responsibility under the existing university vendor agreement.

The only personal information collected is the student's typed name (and, optionally in a future version, their 10-digit ASU ID). No SSN, no health data, no demographic attributes, no financial data, no third-party tracking.

## FERPA posture

LabFrame is operated by ASU faculty as part of their official instructional duties — qualifying as a "school official" under the FERPA legitimate-educational-interest exception (34 CFR § 99.31(a)(1)). It does not transfer protected records to any third party.

The system holds FERPA-protected records only **transiently** — during the milliseconds the signing function processes a request. Persistent storage of student work occurs only on the student's own device (browser storage they control), in the PDF they themselves download, and in Canvas after submission. LabFrame itself does not maintain a persistent store of student records.

No specific FERPA consent is required because student-typed name is FERPA directory information, and lab work is created and submitted by the student through their own action.

## Risks at a glance

The data-handling design accepts the following risks, each with mitigations documented in the full reference:

| Risk | Severity | Mitigation status |
|---|---|---|
| Browser-local data on shared devices | Low | Disclosed to students; "start fresh" function provided |
| Signing-secret compromise (Vercel breach or insider) | Low | Standard secret rotation; small blast radius |
| PDF tampering after signing | Low | Cryptographic signature catches casual tampering |
| Motivated signature forgery (re-submitting modified content) | Moderate, by design | Mitigation (nonce binding) deferred to v1.1 |
| No independent penetration test | Unknown | **Recommended before broad rollout beyond pilot** |

Two items leadership should be aware of: (a) LabFrame has not had a third-party penetration test, and (b) authentication via Canvas LTI is planned but not in v1.0 — students currently identify themselves by typing their name.

## What's being asked of the reader

Endorsement to proceed with v1.0 deployment for ASU PHY 114 and the general physics catalog, with the understanding that:

1. **No new vendor agreement is required** — this is internally developed, not vendor-procured.
2. **No FERPA consent forms are required** beyond ASU's standard annual notification.
3. **A penetration test is recommended** before expansion beyond a pilot cohort.
4. **The full data-handling reference** ([docs/DATA_HANDLING.md](./DATA_HANDLING.md)) is available for IT Security and Privacy Office review.

## Quick reference

- **Project owner:** Austin Reaves, ASU Department of Physics (Interactive Physics Labs)
- **Source code:** Internal repository, available on request
- **Hosting:** Vercel (US East), with an HMAC signing secret stored in Vercel's encrypted environment variables
- **Open-source dependencies:** standard React/TypeScript stack; full audit trail in `package.json` and `package-lock.json`
- **Compliance review document:** [docs/DATA_HANDLING.md](./DATA_HANDLING.md)
- **System design document:** [REBUILD_SPEC.md](../REBUILD_SPEC.md)

---

*One-page summary. For technical, legal, and operational detail, see the full data handling reference.*
