# PRD: Logical Programming Learning App

## Introduction

Build an internal prototype learning app for practicing logical programming problems, similar in spirit to LeetCode. Problems are authored in MDX, learners solve them in an in-browser editor, and tests run in the browser. Users must enter a username before using any part of the app. There is no password, no recovery flow, and no strong identity guarantee in v1.

The first release supports JavaScript and PHP as script-style languages. Both languages receive raw `stdin` and produce raw `stdout`. Tests are stored in a simple language-neutral `stdin`/`stdout` format inside the problem MDX metadata.

The app is learning-first and collaboration-first, not competition-first. Browser-only execution results are personal learning signals, not trusted achievements. All visible tests are shown to users before they run code, all submissions are visible to logged-in users, and social activity is intentionally open for internal collaboration.

## Goals

- Require username-only login before showing any app content.
- Allow users to browse official repo-backed MDX problems and user-published MDX problems.
- Let users solve problems in JavaScript and PHP from day one.
- Run JavaScript and PHP solutions in the browser using script-style `stdin`/`stdout`.
- Show all test cases before running code.
- Persist drafts, submissions, solved status, manually pinned best submissions, and progress in Supabase.
- Allow any logged-in prototype user to upload, draft, publish, and revise MDX problems.
- Store immutable submission snapshots while keeping the latest draft editable.
- Show all users' submissions, including source code, to other logged-in users.
- Provide social activity for started attempts, submissions, solved problems, published problems, and manually pinned best submissions.
- Version published problems so historical submissions remain tied to the exact problem version they used.

## Product Decisions From Grilling

- The prototype uses weak username identity. Entering an existing username resumes that username's profile.
- Internal access is enforced only by URL sharing/obscurity in v1.
- Supabase policies may be permissive for the prototype and use username as the app identity.
- JavaScript is the v1 language label. Real Node.js/WebContainers are future scope.
- JavaScript and PHP both use script-style `stdin`/`stdout`; no required function entrypoint in v1.
- Tests use raw `stdin` text and expected raw `stdout` text.
- Output comparison normalizes line endings and trims trailing whitespace, while preserving internal whitespace.
- Only visible tests exist in v1; every test is shown before running.
- Passing all visible tests marks the problem solved for that user/problem version/language.
- Submissions are immutable; drafts remain editable.
- Keep the latest draft, the user-pinned best submission, and the last 20 submissions per username/problem/language.
- Users manually pin their best submission; automatic best-result detection is out of scope.
- "Improved result" social events occur only when a user manually pins a new best submission.
- All submissions and submitted code are visible to every logged-in user, even before solving the problem.
- The problem view remains editor-first, with submissions in a secondary tab or panel.
- Opening a problem/editor creates a stored "started attempting" activity event.
- Activity feed events are not deduplicated in the prototype.
- Publishing a problem creates a social feed event; draft uploads do not.
- Editing a published problem creates a new version.
- New users see the latest published problem version by default.
- Existing users stay on the problem version they started unless they explicitly switch.
- If a user solved an older version and a newer version exists, the UI shows both previous solved status and latest-version unsolved status.
- Progress is tracked both overall per problem and separately per language.

## User Stories

### US-001: Username Login Gate
**Description:** As a visitor, I want to enter a username before using the app so that my work and activity can be associated with that username.

**Acceptance Criteria:**
- [ ] The first screen shows only a username form.
- [ ] Username is required before viewing the problem list, problem detail, editor, submissions, uploads, progress, or social feed.
- [ ] Username must be non-empty after trimming whitespace.
- [ ] Entering an existing username resumes that username's profile.
- [ ] No password, email, OAuth, or recovery flow is requested.
- [ ] The UI makes no claim that username identity is secure.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-002: Problem List
**Description:** As a logged-in learner, I want to browse available problems so that I can choose what to practice.

**Acceptance Criteria:**
- [ ] Problem list shows official repo-backed problems and published uploaded problems.
- [ ] Each problem row shows title, difficulty, tags, supported languages, latest version indicator, and my completion status.
- [ ] Completion status can show unsolved, solved current version, solved previous version, and latest version unsolved.
- [ ] Problem list supports filtering by difficulty and tag.
- [ ] Problem list supports sorting by newest, difficulty, and completion status.
- [ ] Selecting a problem opens the correct default version for that user.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-003: MDX Problem Schema
**Description:** As a content author, I want problems to have a consistent MDX schema so that the app can render them and run tests for JavaScript and PHP.

**Acceptance Criteria:**
- [ ] Define a problem schema with id, title, difficulty, tags, description content, supported languages, visible tests, constraints, and starter code.
- [ ] Tests use raw `stdin` and expected raw `stdout`.
- [ ] `signature` and `entrypoint` metadata are optional future-facing fields, not required for v1.
- [ ] Problem schema validation rejects missing id, missing title, invalid difficulty, missing supported languages, malformed tests, and missing starter code for a supported language.
- [ ] Problem body can be rendered from MDX.
- [ ] Full MDX is allowed for the internal prototype.
- [ ] Validation errors identify the invalid field and problem id.
- [ ] Typecheck/lint passes.

### US-004: Official MDX Problem Ingestion
**Description:** As a developer, I want official problems loaded from repo MDX files so that curated content can ship with the app.

**Acceptance Criteria:**
- [ ] Official MDX files are stored in a dedicated problems directory.
- [ ] A build-time or startup ingestion step validates official MDX files.
- [ ] Valid official problems appear in the problem list.
- [ ] Invalid official problems fail loudly during development or build.
- [ ] Official problem ids are stable across deployments.
- [ ] Official problem versions are stable and traceable.
- [ ] Typecheck/lint passes.

### US-005: Problem Detail View
**Description:** As a logged-in learner, I want to read a problem statement beside the editor so that I can understand and solve the task.

**Acceptance Criteria:**
- [ ] Problem detail view renders title, difficulty, tags, description, examples, constraints, and every visible test.
- [ ] Problem content is readable on desktop and mobile layouts.
- [ ] Tests are shown as `stdin` and expected `stdout`.
- [ ] The selected language is visible and changeable.
- [ ] If multiple versions exist, the current version is visible.
- [ ] Existing users stay on their started version unless they explicitly switch.
- [ ] Navigation back to the problem list preserves the user's session.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-006: Code Editor
**Description:** As a logged-in learner, I want an editor for JavaScript and PHP so that I can write and revise solutions.

**Acceptance Criteria:**
- [ ] Editor supports JavaScript and PHP modes.
- [ ] Changing language loads the saved draft for that language if one exists.
- [ ] If no saved draft exists, editor loads language-specific starter code from the problem schema.
- [ ] Editor supports basic syntax highlighting.
- [ ] Editor content is saved as the latest draft without requiring test execution.
- [ ] The problem view remains editor-first, with submissions accessible in a secondary tab or panel.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-007: JavaScript Browser Runner
**Description:** As a logged-in learner, I want to run JavaScript scripts in the browser so that I can get immediate feedback.

**Acceptance Criteria:**
- [ ] Runner executes JavaScript code in an isolated browser worker or iframe.
- [ ] Runner provides the test case `stdin` to the user's script through a documented browser-runner API, such as a global `stdin` string.
- [ ] Runner captures output from a documented browser-runner API, such as `print(...)` and/or `console.log(...)`.
- [ ] Runner captures script errors as `stderr`.
- [ ] Runner compares captured `stdout` to expected `stdout` after normalizing line endings and trimming trailing whitespace.
- [ ] Runner preserves meaningful internal whitespace during comparison.
- [ ] Runner enforces a per-run timeout.
- [ ] Runner reports stdout, stderr, passed test count, failed test details, duration, and timeout status.
- [ ] Runner does not promise real Node.js APIs, filesystem access, npm packages, or `require`.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-008: PHP Browser Runner
**Description:** As a logged-in learner, I want to run PHP scripts in the browser so that PHP learners can practice the same problems.

**Acceptance Criteria:**
- [ ] Runner executes PHP code using a browser-compatible PHP WebAssembly runtime.
- [ ] Runner provides the test case `stdin` to the user's script.
- [ ] Runner captures the script's `stdout` and `stderr`.
- [ ] Runner compares captured `stdout` to expected `stdout` after normalizing line endings and trimming trailing whitespace.
- [ ] Runner preserves meaningful internal whitespace during comparison.
- [ ] Runner enforces a per-run timeout.
- [ ] Runner reports stdout, stderr, passed test count, failed test details, duration, and timeout status.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-009: Test Result Display
**Description:** As a logged-in learner, I want clear test results so that I know what failed and how to improve my solution.

**Acceptance Criteria:**
- [ ] Result panel shows pass/fail summary after each run.
- [ ] Each failed test shows stdin, expected stdout, and actual stdout.
- [ ] Runtime errors are shown separately from assertion failures.
- [ ] Timeout failures clearly state that execution exceeded the limit.
- [ ] Results are associated with the selected language and problem version.
- [ ] Result labels avoid trusted competitive claims such as verified fastest, verified memory usage, or verified complexity.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-010: Save Drafts And Submissions
**Description:** As a logged-in learner, I want my drafts and test runs saved so that I can resume work and review progress later.

**Acceptance Criteria:**
- [ ] Latest draft code is saved per username, problem version, and language.
- [ ] Draft code remains editable after submissions are created.
- [ ] Every test run creates an immutable submission record with code snapshot, language, pass count, total count, result details, duration, and timestamp.
- [ ] Passing all visible tests marks the problem version solved for that username and language.
- [ ] Previous solved status is not removed by a later failing run.
- [ ] The app keeps the latest draft, the manually pinned best submission, and the last 20 submissions per username/problem/language.
- [ ] Older non-pinned submissions beyond the last 20 can be deleted or archived.
- [ ] Typecheck/lint passes.

### US-011: User Progress View
**Description:** As a logged-in learner, I want to see my progress so that I know what I have completed and what I should continue.

**Acceptance Criteria:**
- [ ] Progress view shows attempted problems, solved problems, selected languages, latest result, pinned best submission, and last activity time.
- [ ] Progress is tracked both overall per problem and separately per language.
- [ ] If a user solved an older version and a newer version exists, the progress view shows previous solved status and latest-version unsolved status.
- [ ] Each progress item links back to the relevant problem and version.
- [ ] Progress view distinguishes draft-only work from submitted attempts.
- [ ] Progress is loaded from Supabase, not only local browser state.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-012: Social Activity Feed
**Description:** As a logged-in learner, I want to see other logged-in users' activity so that the app feels active and collaborative.

**Acceptance Criteria:**
- [ ] Social feed is hidden from users who have not completed username login.
- [ ] Feed shows events for started attempting, submitted attempt, solved problem, published problem, and pinned best submission.
- [ ] Feed item shows username, problem title, problem version when relevant, language when relevant, event type, and timestamp.
- [ ] Feed events are not deduplicated in v1.
- [ ] Feed may be noisy in the prototype.
- [ ] Feed updates without a full page reload when realtime updates are available.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-013: Currently Attempting Presence
**Description:** As a logged-in learner, I want to see who is currently attempting a problem so that I can sense live activity.

**Acceptance Criteria:**
- [ ] Problem detail view shows active logged-in users currently attempting that problem.
- [ ] Presence updates when a user enters or leaves the problem view.
- [ ] Presence entries include username and selected language.
- [ ] Opening a problem/editor also creates a stored "started attempting" activity event.
- [ ] Stale presence is removed automatically after a reasonable timeout or disconnect event.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-014: Pin Best Submission
**Description:** As a logged-in learner, I want to manually pin my best submission so that I can choose which result represents my best work.

**Acceptance Criteria:**
- [ ] User can pin one submission as best for a username, problem, and language.
- [ ] Pinning a new best submission replaces the previous pinned best for that username/problem/language.
- [ ] Pinning a new best submission creates an "improved result" activity event.
- [ ] The system does not automatically calculate best submission from duration, code size, or pass count.
- [ ] The UI labels pinned submissions as user-selected best results.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-015: Public Submission Browser
**Description:** As a logged-in learner, I want to view other users' submissions so that I can learn from different approaches.

**Acceptance Criteria:**
- [ ] All logged-in users can view all submissions from all usernames.
- [ ] Submitted source code is visible.
- [ ] Submissions are visible even if the viewer has not solved the problem.
- [ ] Submission list shows username, problem title, problem version, language, pass count, total count, timestamp, and pinned-best status.
- [ ] Submission detail shows source code and result details.
- [ ] Submission browsing is secondary to the editor-first problem view.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-016: MDX Upload
**Description:** As a logged-in prototype user, I want to upload new MDX problems so that new content can be added without committing to the repo.

**Acceptance Criteria:**
- [ ] Any logged-in user can access the upload page.
- [ ] Upload page accepts an MDX file or MDX text.
- [ ] Uploaded content is validated against the same problem schema as official repo problems.
- [ ] Full MDX is allowed in the internal prototype.
- [ ] Invalid uploads show field-specific validation errors before publishing.
- [ ] Valid uploads can be saved as draft.
- [ ] Draft uploaded problems do not appear in the public problem list.
- [ ] Draft uploads do not create social feed events.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-017: Publish Uploaded Problem
**Description:** As a logged-in prototype user, I want to publish a validated uploaded problem so that learners can solve it.

**Acceptance Criteria:**
- [ ] Any logged-in user can publish a validated draft problem.
- [ ] Published uploaded problems appear in the problem list for all logged-in users.
- [ ] Publishing a problem creates a social feed event.
- [ ] Published uploaded problems are versioned.
- [ ] Updating a published problem creates a new version rather than mutating historical submissions.
- [ ] Existing submissions remain linked to the problem version they ran against.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-018: Problem Version Selection
**Description:** As a learner, I want problem versions to behave predictably so that my existing work does not change unexpectedly.

**Acceptance Criteria:**
- [ ] New users see the latest published version of a problem by default.
- [ ] Existing users return to the version they started unless they explicitly switch.
- [ ] User can switch to the latest version when one exists.
- [ ] Switching versions makes it clear that tests, statement, starter code, and solved status may differ.
- [ ] Submissions remain linked to the exact problem version they ran against.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser using dev-browser skill.

### US-019: Prototype Data Access Model
**Description:** As a developer, I need the data access model to match the prototype identity rules so that implementation does not pretend to provide stronger security than it does.

**Acceptance Criteria:**
- [ ] Profiles, attempts, submissions, and progress are keyed by username for v1 prototype behavior.
- [ ] Entering an existing username can read and write that username's drafts and progress.
- [ ] Logged-in users can read published problem metadata, social activity, and all submissions.
- [ ] Logged-in users can upload and publish problems.
- [ ] Unauthenticated visitors cannot access app data through the UI before entering a username.
- [ ] Documentation states that this is weak prototype identity and not suitable for untrusted public use without stronger access controls.
- [ ] Typecheck/lint passes.

## Functional Requirements

- FR-1: The system must require username login before showing any app content.
- FR-2: The system must create or retrieve a profile by username.
- FR-3: The system must not require a password, email, OAuth, or account recovery in v1.
- FR-4: The system must allow entering an existing username to resume that username's profile.
- FR-5: The system must load official problems from repo-backed MDX files.
- FR-6: The system must support uploaded MDX problems stored in Supabase.
- FR-7: Any logged-in user must be able to upload, validate, save as draft, publish, and revise MDX problems.
- FR-8: The system must validate all official and uploaded problems against one shared problem schema.
- FR-9: The problem schema must include id, title, difficulty, tags, supported languages, starter code, visible tests, and constraints.
- FR-10: The problem schema may include optional `signature` and `entrypoint` metadata for future function-style problems.
- FR-11: The problem schema must express tests as raw `stdin` and expected raw `stdout`.
- FR-12: The system must show every test case before running code.
- FR-13: The system must not include hidden tests in v1.
- FR-14: The problem detail page must render full MDX content and structured metadata.
- FR-15: The editor must support JavaScript and PHP script-style solutions from the first release.
- FR-16: The editor must save latest draft code per username, problem version, and language.
- FR-17: The JavaScript runner must execute code in a browser-isolated context and provide test stdin.
- FR-18: The JavaScript runner must not promise real Node.js APIs in v1.
- FR-19: The PHP runner must execute code through a browser-compatible PHP WebAssembly runtime and provide test stdin.
- FR-20: Each runner must capture stdout and stderr.
- FR-21: Each runner must compare stdout by normalizing line endings and trimming trailing whitespace while preserving internal whitespace.
- FR-22: Each runner must enforce timeouts and return structured results.
- FR-23: Each test run must create an immutable submission record in Supabase.
- FR-24: The system must keep the latest draft, manually pinned best submission, and last 20 submissions per username/problem/language.
- FR-25: The system must mark a problem version as solved when a submission passes all visible tests for that version.
- FR-26: The system must track progress both overall per problem and separately per language.
- FR-27: The system must retain historical submissions when a problem is updated.
- FR-28: The system must create activity events for started attempting, submitted attempt, solved problem, published problem, and pinned best submission.
- FR-29: The social feed must be visible only to logged-in users.
- FR-30: The system must show all submissions and submitted source code to logged-in users.
- FR-31: The system must allow viewing submissions before solving the problem.
- FR-32: The system must show currently active users on a problem when realtime presence is available.
- FR-33: The system must create a stored started-attempting event when a user opens a problem/editor.
- FR-34: The system must not deduplicate activity feed events in v1.
- FR-35: Users must manually pin best submissions.
- FR-36: The system must create an improved-result event only when a user pins a new best submission.
- FR-37: The system must avoid claiming verified algorithmic time complexity, memory complexity, or storage complexity from browser-only runs.
- FR-38: Published uploaded problems must be visible to all logged-in users.
- FR-39: Editing a published problem must create a new version.
- FR-40: New users must see the latest published problem version by default.
- FR-41: Existing users must stay on the version they started unless they explicitly switch.
- FR-42: If a user solved an older version and a newer version exists, the UI must show both previous solved status and latest-version unsolved status.
- FR-43: Unauthenticated users must not be able to access app pages through the UI before entering a username.

## Non-Goals

- No password-based authentication in v1.
- No OAuth login in v1.
- No secure identity, impersonation prevention, or account recovery in v1.
- No server-side code execution or trusted competitive judging in v1.
- No hidden tests in v1.
- No paid subscriptions, billing, or organizations in v1.
- No comments, direct messages, or discussion threads in v1.
- No verified global leaderboard in v1.
- No automatic best-submission ranking in v1.
- No automatic algorithmic complexity analysis in v1.
- No real Node.js environment guarantee in v1.
- No support for languages beyond JavaScript and PHP in v1.
- No admin-only upload control in v1.
- No public-untrusted deployment hardening in v1.

## Design Considerations

- The first screen should be the username login form, not a marketing landing page.
- After login, the app should open directly to the problem list.
- The main solving view should prioritize the problem statement and editor.
- Submissions should be accessible in a secondary tab or panel, not the primary first impression.
- Test results should be visible without navigating away from the editor.
- UI should feel like a focused learning tool: clear navigation, compact metadata, readable problem content, and fast feedback.
- Use badges or compact labels for difficulty, tags, language, version, and solved status.
- Use tabs or a segmented control to switch between JavaScript and PHP.
- Use a clear run button with visible loading, success, failure, and timeout states.
- Show source code in submission detail views with syntax highlighting.
- Use careful language for browser-only results: "local result", "passed visible tests", and "pinned best", not "verified fastest" or "optimal".

## Technical Considerations

- Recommended hosting: Vercel for the Next.js UI and Supabase for database, storage, and realtime features.
- Username-only login uses username as the prototype app identity. This intentionally allows impersonation by entering an existing username.
- Because internal access is by obscurity only, the app should not be described as secure for public untrusted users.
- Supabase policies can be permissive for the prototype but must not be documented as strong user data protection.
- Problems should have stable ids and explicit versions so submissions can be traced to the exact tests used.
- Full MDX uploaded by any logged-in user is allowed for the internal prototype. This is a security risk if deployed to an untrusted audience.
- Browser-only code execution must run in an isolated worker or iframe and must not expose Supabase service keys, app internals, or privileged APIs.
- PHP execution requires a browser-compatible PHP WebAssembly runtime.
- JavaScript execution should start with script-style JavaScript in a sandboxed browser context using a documented `stdin` and output API. Full Node.js APIs are future scope.
- Vercel deployment may require special security headers if a future implementation uses WebContainers or other cross-origin-isolated runtimes.
- Runtime and memory measurements from browser execution are approximate and should be presented as learning feedback, not trusted competitive metrics.
- Supabase Realtime can power the social feed and currently-attempting presence.
- Since all submissions are visible, submitted source code should not be treated as private data.

## Suggested Data Model

- `profiles`: stores username, display name, created timestamp, and updated timestamp.
- `problems`: stores stable problem id, source type, current published version id, title, difficulty, tags, supported languages, created by username, created timestamp, and updated timestamp.
- `problem_versions`: stores problem id, version number, MDX content, parsed problem schema, status, created by username, created timestamp, and published timestamp.
- `attempts`: stores latest draft code per username, problem version, and language.
- `submissions`: stores immutable code snapshot, username, problem id, problem version id, language, result summary, test result details, duration, pinned best flag, and created timestamp.
- `progress`: stores latest status per username and problem, including overall attempted, overall solved, language-specific solved states, started version, latest attempted version, pinned best submission, and last activity timestamp.
- `activity_events`: stores social events such as started attempting, submitted attempt, solved problem, published problem, and pinned best submission.
- `presence`: may be implemented through Supabase Realtime presence rather than a durable table.
- `problem_uploads`: stores uploaded drafts, validation status, created by username, and linked published problem/version when published.

## Suggested Problem Schema Example

```md
---
id: two-sum
title: Two Sum
difficulty: easy
tags: [arrays, hash-map]
supportedLanguages: [javascript, php]
starterCode:
  javascript: |
    const input = stdin.trim();

    // Parse input and print the answer with print(...).
  php: |
    <?php
    $input = trim(stream_get_contents(STDIN));

    // Parse input and print the answer.
tests:
  visible:
    - name: sample 1
      stdin: |
        4
        2 7 11 15
        9
      stdout: |
        0 1
    - name: sample 2
      stdin: |
        3
        3 2 4
        6
      stdout: |
        1 2
limits:
  timeMs: 1000
---

Given an array of integers and a target, print the indexes of two numbers that add up to the target.
```

## Success Metrics

- A logged-in user can enter a username, open a problem, write code, run tests, and see results in under 60 seconds.
- At least 95% of valid problem MDX files pass schema validation during ingestion.
- Draft code is restored correctly after page refresh for the same username, problem version, and language.
- Test run submission records are created for 100% of completed test runs.
- Solved status appears correctly in the problem list and progress view after passing all visible tests.
- A user can manually pin a best submission and see it reflected in progress and the social feed.
- Logged-in users can view all submissions and submitted source code.
- Social feed events appear to logged-in users within 5 seconds when realtime connectivity is available.
- A logged-in user can upload, validate, draft, publish, and revise a problem without a code deployment.

## Open Questions

- Which PHP WebAssembly runtime should be used for the browser PHP runner?
- Should uploaded full MDX be restricted before any external or broader internal rollout?
- Should Vercel Deployment Protection or another real access boundary be added before sharing beyond a trusted internal group?
- Should real Node.js/WebContainers be added later, or should JavaScript remain script-only?
- Should future problem types support optional function signatures and structured input/output in addition to v1 `stdin`/`stdout`?
