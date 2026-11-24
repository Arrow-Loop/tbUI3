# Roadmap: tbUI3IDE

Outstanding work and deferred decisions. [CHANGELOG](CHANGELOG.md) records completed work and evidence; [README](README.md) describes the current add-in; [architecture](ARCHITECTURE.md), [Ribbon mapping](RIBBON_LAYOUT.md) and [installation specification](INSTALLATION_MANAGER_SPEC.md) own enduring technical and product requirements.

## Immediate priority: Phase 1 native acceptance

Use [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md) for the authoritative build/test sequence. Accepted Updater 0.2.0.0 (58/58 self-tests and compiled startup) and both themes are embedded in canonical tbUI3IDE 0.4.0.0. Next gate: compile both add-in architectures, verify compiled resource hashes, then test live. Refresh this checkpoint if new evidence arrives.

- Verify DLL-only offline first install, silent missing-resource repair, preserved custom/newer files, shared/local duplicate loader behavior and compatibility on the supported IDE build. Retain both architecture checks.
- Validate the integrated Welcome/settings (healthy six-page flow; conditional Setup directly after Welcome, before Updates), actual installed themes/inheritance, exact-name apply/rollback, toolbar modes, Windows theme/accent, focus/keyboard/Escape, skip/reopen, settings persistence, DPI and missing Runtime. The view is approved; no additional redesign without direction.
- Validate two IDE roots and concurrent shared operations, release checking/staging, normal-exit approval/cancel, preservation of projects/custom files, rollback/recovery, detached self-update, protected-folder consent/UAC denial and verified prerelease packaging. Use disposable roots/profile state for destructive cases.
- Ship only after the approved combined first-release gate passes. Official IDE in-place updates remain in scope; retain all verification, backups, rollback and consent. No main merge, PR or public release without approval.

## Ribbon, Hybrid and Classic acceptance

The [Ribbon mapping](RIBBON_LAYOUT.md) is the command organization authority. Keep all native menu/toolbar commands reachable, preserve live nodes/state/shortcuts/selectors/handlers and future native discoveries; fall back to Classic when private host structure is unsupported.

- Review the outstanding observations from Claude's audit: truncated Center in Container caption, inconsistent caption case, and Debug Start/Stop accessibility. Check actual latest implementation before making changes; these are review findings, not fixes or confirmed regressions.
- Native visual/interaction check: full/simplified command geometry, compact widths, top-aligned glyphs, long labels, Grid toggle/options and spacing, inline contextual MultiPage, direct alignment/size and Insert commands, icons/tooltips and File Backstage. Test real/custom titlebar and Quick Access Build/Save/Undo/Redo/Play/Pause/Stop, focus/return, dropdown outside dismissal and narrow-window horizontal overflow.
- Mode transitions and persistence: all themes and styling On/Off; WinUI3-only elevation/insets and live Windows accent, caption contrast, no accidental command duplication/loss, editor-following Code/Form, stable manual tabs, project reload/unload. Preserve Hybrid native menus and smaller inventory without Backstage or Quick Access; Classic retains original native inventory.
- Native Save Document and Form/Code: selected dirty/read-only state, two dirty documents (save one without affecting the other), unsaved project Save As/cancel, paired form/code vs standalone module, reopen and both replacement profiles/presentations.
- Future adaptive group collapse/overflow and keytips; File > Add-ins actual enable/disable remains contingent on host API and restart behavior. Keep contributed command discovery and unknown-menu fallback accessible. The add-in's own Message Box Builder is approved future scope, not implemented.

## TabView designer acceptance

Use [UI3TabView contract](../docs/controls/UI3TabView.md) and [architecture](ARCHITECTURE.md) for the bridge's ownership and lifecycle. Adapter v10 remains the current source checkpoint.

- Verify freshly drawn host + creates exactly one actual saved page, add/select/switch/drop/reorder/delete (including children), save/reopen and undo/redo. Repeat delete/readd on two differently sized hosts and confirm generated members, Properties, bounds, selection and child coordinates; no hidden orphan pages.
- Confirm native page lock protects page geometry against direct movement/resize but allows child editing and host resize; cleanup retains pre-existing locks. Confirm toolbox UI3TabPage hiding across rebuild/unload and normal +/New page authoring; verify optional New Page context verb and property refresh.
- Preserve host-scoped names, avoid automatic renaming of existing code references on host rename/reparenting, and design repeated-name/array identity separately. Confirm Properties-selected child reveal and current overflow behavior.
- If intermittent reference reload/deserialization, snapshot paint exception or wrong temporary HWND size recurs, capture exact native stage and diagnostics before changing stored data or layout. Recheck private designer APIs per beta and replace with supported APIs when available. Keep final win64 smoke and actual native evidence.

## Theme and optional styling follow-ups

- Test both themes and current styling in BETA 1045 and recheck theme property map/selectors and private host hooks with each later beta. Verify menus, dialogs, text fields, Options, docking margins, headers, code tabs, context menus, hover, Windows accent and titlebar, no overflow/gaps; use [README checks](README.md#what-to-check).
- Remaining enhancements: property sheet list-row styling, possible accent Open button (requires approval), Segoe UI Variable across remaining surfaces, Monaco hover/scrollbar theme and other host-fixed details. If host blocks page access, retain standalone themes and Classic fallback; do not modify vendor IDE files for styling.
- Exploratory upstream theme-property requests (only with approval), static accent variants and optional syntax palette. Fluent toolbox icon replacement was explicitly dropped: each control owns its toolbox icon.

## Deferred installation-manager milestones

[Installation Manager specification](INSTALLATION_MANAGER_SPEC.md) owns approved constraints. Phase 2: InstallAlongside and ArchivePrevious strategies, configurable cross-volume archive locations and archive/new/both custom-content routing. Phase 3: conservative installation discovery/reorganization, optional shortcut management and advanced historical add-in override after loader behavior is verified. Do not expand Phase 1 to include them.

Restore the visible stable/development channel selector only once a genuine stable twinBASIC channel exists. Consider optional control-package distribution when real release assets exist (never silently rewrite embedded packages), working-directory/launch-context capture where supported and automated release CI after native acceptance.

## Documentation maintenance

Keep current status in the handoff, product decisions in the specification, implementation contracts in the technical references and history in CHANGELOG. The retired preliminary plans are in Git history; do not recreate competing sources of truth. Retain older candidate notes in Git history; do not treat old version checkpoints as pending tasks. The root [ROADMAP](../ROADMAP.md) owns the separate core package migration.
