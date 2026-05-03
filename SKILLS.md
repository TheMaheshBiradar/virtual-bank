# Project Skills Handbook

## Skill: UI Craftsmanship
- **Pattern**: Zero-default styling.
- **Rules**: Use high-contrast typography (italic headings, tracking-tight), subtle borders (zinc-100/200), and intentional white space.
- **Reference**: `/src/index.css`

## Skill: State Synchronization
- **Pattern**: Context-to-Component flow.
- **Rules**: Use `useAuth` for permission gating and `useTranslation` for language-aware rendering.
- **Checklist**: Did you add the new strings to `translations.ts` in all supported languages?

## Skill: Destructive Action Safety
- **Pattern**: Confirmation-First.
- **Rules**: Never allow a delete operation without invoking `ConfirmModal`.
- **Implementation**: Pass the delete logic as a callback to the global confirmation state in `KanbanBoard`.

## Skill: Opportunity Lifecycle
- **Pattern**: Validated State Transitions.
- **Rules**:
  - Check `OPPORTUNITY_TYPES[type].allowedTransitions` before moving a card.
  - Record a `HistoryEntry` for every stage change.
  - Ensure `ownerAlias` is mapped to a valid `User` via `useAuth`.

## Skill: I18n Dictionary Management
- **Pattern**: Triple-Key Consistency.
- **Rules**:
  - Every new UI string must be added to all four supported language blocks: `en`, `de`, `fr`, `it`.
  - Use snake_case for keys (e.g., `delete_confirm_title`).
  - Use `{variable}` syntax for dynamic content and replace it in the component using `.replace()`.

## Skill: AI Insight Generation (Gemini)
- **Pattern**: Lazy-Loaded AI Analysis.
- **Rules**:
  - Only invoke Gemini API when `can('VIEW_INSIGHTS')` returns true.
  - Prompt structure: Context (Pipeline State) + Task (Actionable Advice) + Format (JSON/Markdown).
  - Use `GoogleGenAI` from `@google/genai` with `process.env.GEMINI_API_KEY`.

## Skill: Spec Alignment
- **Pattern**: SDS (Spec -> Design -> Synthesis).
- **Rules**: Every component property must be documented in `spec.md` if it changes the data flow.
