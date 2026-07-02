# PDF export failures and lost-name work: plain-language briefing

**Date:** 2026-07-02
**Branch:** `claude/funny-cray-cee612`

## What was going wrong

**Problem 1: "Failed to fetch dynamically imported module" when exporting or saving a draft.**
A student clicked "Export PDF" (or "Save draft") and got an error mentioning a missing
file. Both buttons failed the same way.

What actually happened: to keep the app fast, the code that builds the PDF is not loaded
up front. It is fetched from the server only at the moment the student clicks export. Each
time we publish a new version of the site, those on-demand files get brand-new names. If a
student had the page open from before an update and then clicked export, the browser went
looking for the old file name, which no longer existed on the server, and failed. It looked
like a broken export button, but the real cause was "your open tab is out of date."

**Problem 2: work could silently not be saved until the student typed their name.**
The app files each student's saved work under their name. Because of that, if a student
started filling in the worksheet before entering their name, there was nothing to file the
work under, so it was not being saved yet. Students often did not enter their name until the
very end, when the export step finally nagged them, meaning early work sat unsaved.

## How they were fixed

**Fix 1: the app now heals itself when a tab is out of date.**
When the browser fails to fetch one of those on-demand files, the app now automatically
reloads the page once, which pulls the current version and its correct file names. The
student's answers are preserved across that reload, and the export works on the next click.
A safety check prevents the page from reloading over and over if something else is wrong.

We also fixed a smaller, separate flaw in the "download the file" step that could, in some
browsers, cancel a download before it finished, with no error shown.

**Fix 2: the app now asks for the student's name before they start.**
On opening a lab, if no name is known yet, a small window appears asking the student to
enter their name before beginning. This guarantees their work is saved correctly from the
very first thing they type. Returning students, and students who arrive from a course link
that already includes their name, do not see this window. The demo lab is exempt.

## Status

All fixes are implemented and tested. The behavior was confirmed by running the app: the
name window appears for new students, rejects an empty or placeholder name, accepts a real
name, and then saves it. Automated tests were added and pass. A separate, pre-existing test
unrelated to this work is known to fail on this machine and was left alone.

A companion technical briefing (same folder) has the full detail and a checklist for another
reviewer to independently confirm the problems were real and fully solved, and to look for
any other ways a student could lose work or be unable to export.
