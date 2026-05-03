# Development Instructions for AI Agents

## Spec-Driven Development (SDD)
Before implementing any feature or modification:
1. **Consult `/spec.md`**: Ensure the change aligns with the project's core architecture and data models.
2. **Update Spec First**: If the change introduces new core logic or data structures, update `/spec.md` before writing code.
3. **Modular Implementation**: Keep components atomic and reusable.

## Coding Standards
- **Styling**: Always use Tailwind CSS utility classes. Follow the "Swiss/Minimalist" aesthetic.
- **Animations**: Use `motion/react` for transitions and state changes.
- **I18n**: All user-facing strings must go into `/src/translations.ts`.
- **Permissions**: Check user roles via `useAuth()` before rendering action-oriented UI (Edit/Delete).

## Verification
- Run `lint_applet` and `compile_applet` after every major functional change.
- Ensure cross-language consistency for all new UI text.
