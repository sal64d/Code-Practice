# Task: Split Design and Logic & Implement Storybook

This task details the steps to decouple visual presentation from functional/application logic in the logical programming learning app. We will integrate Storybook and move all styling, presentation components, and visual layouts to a dedicated `design-system` directory using **Material UI (MUI)**.

## Objectives
1. **Zero Styling in Application**: Visual styles, CSS rules, layout details, and UI framework tags are completely isolated from routing, queries, API hooks, and state managers.
2. **Interactive Component Sandbox**: Implement Storybook to isolate, document, and test UI components in all states.
3. **MUI Integration**: Implement a highly customized, premium MUI theme (dark mode, glassmorphism, modern typography) to ensure stunning aesthetics.
4. **Pure Presentational Components**: Create reusable, functional React components that communicate solely via props. CodeMirror logic remains in the app layer.

---

## Detailed Agent Execution Checklist

### Step 1: Install Storybook, MUI & Dependencies
- [ ] Run `cd app/ui && yarn dlx storybook@latest init --help` to check flags, then run non-interactive initialization (e.g. `yarn dlx storybook@latest init -y --type react`).
- [ ] Add MUI packages: `cd app/ui && yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material @fontsource/inter`.
- [ ] Ensure Storybook works (`yarn storybook` starts successfully).

### Step 2: Establish Design System Structure & Theme
- [ ] Create `app/ui/src/design-system/theme.ts`. Export a `createTheme` configured with dark mode (`#16171d`), primary accent (`#aa3bff`), Inter font, and customized component overrides for a premium look (glassmorphism, shadows).
- [ ] Configure `app/ui/.storybook/preview.tsx` to include `<ThemeProvider theme={theme}>` and `<CssBaseline />` so stories render with the custom theme. Import `@fontsource/inter` here.

### Step 3: Extract Atoms & Presentational Components
- [ ] Create `app/ui/src/design-system/components/Button.tsx` (and `.stories.tsx`) wrapping `MuiButton`.
- [ ] Create `app/ui/src/design-system/components/Input.tsx` (and `.stories.tsx`) wrapping `MuiTextField`.
- [ ] Create `app/ui/src/design-system/components/Card.tsx` (and `.stories.tsx`) wrapping `MuiCard`.
- [ ] Create `app/ui/src/design-system/components/TestResultsPanel.tsx` (and `.stories.tsx`), migrating visual rendering logic from the old `TestResults.tsx`. Accepts `RunSummary` prop.
- [ ] Create `app/ui/src/design-system/components/EditorContainer.tsx` (and `.stories.tsx`) which only provides a styled MUI Box for CodeMirror.

### Step 4: Extract Layouts & Organisms
- [ ] Create `app/ui/src/design-system/layouts/AppLayout.tsx`: Define strict prop interface (`session`, `onLogout`, `navItems`, `children`).
- [ ] Create `app/ui/src/design-system/layouts/LoginPageLayout.tsx`: Define strict prop interface (`username`, `onUsernameChange`, `onSubmit`, `isLoggingIn`, `loginError`, `isSupabaseConfigured`).
- [ ] Create `app/ui/src/design-system/layouts/ProblemTable.tsx`: Define prop interface (`problems`).
- [ ] Create `app/ui/src/design-system/layouts/ProblemPageLayout.tsx`: Define strict prop interface (`title`, `difficulty`, `mdxContent`, `editor` as ReactNode, `results` as ReactNode, `onRun`, `onSubmit`, `isRunning`, `isSubmitting`, `submitError`).
- [ ] Create `.stories.tsx` for all layouts with mocked data props.

### Step 5: Refactor Application Pages (Logic-Only)
- [ ] Modify `app/ui/src/providers/AppProviders.tsx` to wrap the app in `<ThemeProvider theme={theme}>` and `<CssBaseline />`.
- [ ] Gut `app/ui/src/pages/LoginPage.tsx` so it only handles local state/auth logic and returns `<LoginPageLayout {...stateAndHandlers} />`.
- [ ] Gut `app/ui/src/pages/ProblemListPage.tsx` so it only fetches data and returns `<ProblemTable problems={problems} />`.
- [ ] Gut `app/ui/src/pages/ProblemDetailPage.tsx` so it only handles execution logic and returns `<ProblemPageLayout editor={<CodeEditor />} results={<TestResultsPanel />} />`.
- [ ] Gut `app/ui/src/components/AppShell.tsx` so it only handles router context and returns `<AppLayout />`.
- [ ] Clean out `app/ui/src/App.css` and `index.css` to remove conflicts.

### Step 6: Verification & Review
- [ ] Build & run Storybook (`yarn storybook`) to verify all states are visually perfect and MUI theme applies correctly.
- [ ] Run typescript checker (`yarn build` in `app/ui`).
- [ ] Run standard local app development server `yarn dev` to confirm full functional equivalence of workflows.
