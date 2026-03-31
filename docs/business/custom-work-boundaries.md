# Custom Work Boundaries

Use this document to decide what stays in monthly support vs what requires a separate scoped project.

## Billable Custom Work (Default)
- Major new product features
- New role models or permission systems beyond current architecture
- New integration work (payments, telephony APIs, CRM, analytics platforms)
- Non-standard reporting dashboards or export pipelines
- Advanced workflow automations beyond existing reminder/check-in patterns
- Large UI redesigns or per-agency layout divergence
- Legacy data migration and normalization work
- Multi-step compliance/legal workflow additions

## Usually Non-Billable (Within Standard Support)
- Fixing bugs in existing supported functionality
- Minor UI polish in existing components
- Updating existing contact details, disclaimers, and basic config values
- Regenerating branding assets from approved source package

## Decision Rules
- If work changes architecture, data model, or adds new surface area: treat as custom.
- If work can be completed with existing config and no code behavior change: treat as support.
- If request creates long-term maintenance burden (agency-specific branch logic): custom scope with maintenance terms.

## Quoting Pattern
- Discovery + scope confirmation
- Written acceptance criteria
- Estimate by phase (implementation, QA, rollout)
- Change-order process for scope drift

## Protection Against Scope Creep
- Require written sign-off before starting custom work.
- Track time separately from support tickets.
- Keep tier commitments aligned with documented feature matrix.
