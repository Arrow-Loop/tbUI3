# Welcome Wizard roadmap and integration dependencies

## Native startup and conditional setup review

- Cody: verify silent bundled-resource provisioning and status publication before first-run Welcome Wizard, without making failed provisioning an onboarding blocker. Confirm actual resource embedding only after native updater acceptance.
- Validate that a healthy snapshot produces a clean Finish page with preferences only; test warnings, missing resources, customized files requiring a repair decision and recovery on a conditional Setup step **before** Finish.
- Confirm bootstrap recheck and approved repair results replace the Setup step when healthy; unresolved issues remain visible and do not falsely claim repair. Native integration, project resource embedding and acceptance remain Cody-owned.
- Review responsive layout and focus behavior when the optional step appears or disappears.

## UI acceptance: finish and installation health

- Review the compact preference list and clean installation-health rows in the live native modal, including narrow widths, customized resources, missing files and repair confirmation.
- Future confirmed preferences may be appended to the summary-entry data array without introducing more fixed-format tiles. Keep actual native state authoritative.
- Native component status IDs remain intact for repair actions; friendly labels are presentation-only, and future resource identifiers should be named explicitly when incorporated into production.

## Phase 1 native integration, deferred to Cody

- Enumerate all *effective* installed twinBASIC IDE themes from both the per-user AppData themes folder and the active portable IDE installation themes folder, including built-ins exposed by the IDE.
- Verify the actual theme-loading precedence for duplicate names, file inheritance, and native selection behavior rather than guessing. Derive actual effective colors from trusted IDE theme values; maintain one selected entry per effective theme.
- Extend the existing installedThemes[].preview native snapshot with optional resolved titlebar, toolbar, panel, editor, muted and border hex colors, retaining the four existing base colors. Do not send raw theme text or construct arbitrary CSS.
- Use the trusted actual installed theme inventory for choose-theme validation. Re-embed welcome.js/css in the canonical add-in resources and regenerate/validate synchronized projects.
- Confirm mini selector geometry, theme values, accessible click/focus, Light/Dark/third-party themes and pinned footer within the real modal IDE host. Browser preview and source checks do not establish native acceptance.

## Deferred product work

- Reintroduce the release-channel selector only when a genuine stable twinBASIC channel exists and native release policy supports it.
- Consider fuller preview fidelity only if a concrete user-facing discrepancy is demonstrated; current intent is a small, consistent, schematic view, not full toolbar/IDE screenshots.
- Preserve future archive/side-by-side strategy architecture under the authoritative Installation Manager specification.

