# Roadmap: tbUI3IDE

Outstanding work and deferred decisions. [CHANGELOG](CHANGELOG.md) records completed work and evidence; [README](README.md) describes the current add-in; [architecture](ARCHITECTURE.md), [Ribbon mapping](RIBBON_LAYOUT.md) and [installation specification](INSTALLATION_MANAGER_SPEC.md) own enduring technical and product requirements.

## Immediate priority: Phase 1 updater ownership correction and native acceptance

- Complete live acceptance of the standalone updater and versioned shutdown bridge on BETA 1043 through 1045. Extend the observed quiet/manual discovery, notification, Update Now and Update on Exit results across the supported builds and architectures. Cover deferral, dirty-project Save/Discard/Cancel, forced exit, process reuse/access failure, minimization, elevation and recovery. Confirm the Save As and asynchronous save-error paths preserve native decisions.
- Measure actual transfer, ZIP/CRC, SHA-256, baseline inventory and detached launch on a disposable update. Evaluate authenticated baseline caching or redundant reads only after measuring. Preserve privileged provenance, signature and containment checks.
- Check notification placement and activation across DPI and multiple monitors, and assess reusing an existing manual review across concurrent IDE instances where the initiating IDE identity stays unambiguous.

- Exercise the new development-only Publish-Release.bat on an authorized prerelease: verify wrong-account, stale/dirty source, corrupt assets and existing-release refusal, draft upload/resume, cancel-before-publish, remote digest verification and exact-commit tag. Validate on both development PCs; do not publish merely to test the launcher.

Use [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md) for the current evidence and build/acceptance sequence.

- Verify DLL-only offline first install, silent missing-resource repair, preserved custom/newer files, shared/local duplicate loader behavior and compatibility on the supported IDE build. Retain both architecture checks.
- Validate the integrated Welcome/settings (healthy six-page flow; conditional Setup directly after Welcome, before Updates), actual installed themes/inheritance, exact-name apply/rollback, toolbar modes, Windows theme/accent, focus/keyboard/Escape, skip/reopen, settings persistence, DPI and missing Runtime. The view is approved; no additional redesign without direction.
- Validate two IDE roots and concurrent shared operations, release checking/staging, normal-exit approval/cancel, preservation of projects/custom files, rollback/recovery, detached self-update, protected-folder consent/UAC denial and verified prerelease packaging. Use disposable roots/profile state for destructive cases.
- Generate the add-in-only release in a fresh output directory from both verified DLLs and the accepted helper. Run the complete regression suite; verify the ZIP contains only both DLLs, the schema-2 manifest has only the add-in component, and SHA256SUMS matches the ZIP and manifest. Exercise an add-in-only update followed by startup provisioning of recognized older updater/themes; preserve newer and customized resources. Separate helper/theme release assets remain an optional future distribution strategy, not a Phase 1 requirement.
- Deploy to the internal team only after the approved combined Phase 1 acceptance gate passes. Explicitly authorized development-testing prereleases may be published sooner under the specification and versioning policy, with disclosed known functional defects and pending acceptance; release integrity, security and traceability gates remain mandatory. Official IDE in-place updates remain in scope; retain all verification, backups, rollback and consent. No main merge, PR or public release without approval.

## Ribbon, Hybrid and Classic acceptance

The [Ribbon mapping](RIBBON_LAYOUT.md) is the command organization authority. Keep all native menu/toolbar commands reachable, preserve live nodes/state/shortcuts/selectors/handlers and future native discoveries; fall back to Classic when private host structure is unsupported.

- Review the outstanding observations from Claude's audit: truncated Center in Container caption, inconsistent caption case, and Debug Start/Stop accessibility. Check actual latest implementation before making changes; these are review findings, not fixes or confirmed regressions.
- Native visual/interaction check: full/simplified command geometry, compact widths, top-aligned glyphs, long labels, Grid toggle/options and spacing, inline contextual MultiPage, direct alignment/size and Insert commands, icons/tooltips and File Backstage. Test real/custom titlebar and Quick Access Build/Save/Undo/Redo/Play/Pause/Stop, focus/return, dropdown outside dismissal and narrow-window horizontal overflow.
- Mode transitions and persistence: all themes and styling On/Off; WinUI3-only elevation/insets and live Windows accent, caption contrast, no accidental command duplication/loss, editor-following Code/Form, stable manual tabs, project reload/unload. Preserve Hybrid native menus and smaller inventory without Backstage or Quick Access; Classic retains original native inventory.
- Native Save Document and Form/Code: selected dirty/read-only state, two dirty documents (save one without affecting the other), unsaved project Save As/cancel, paired form/code vs standalone module, reopen and both replacement profiles/presentations.
- Future adaptive group collapse/overflow and keytips; File > Add-ins actual enable/disable remains contingent on host API and restart behavior. Keep contributed command discovery and unknown-menu fallback accessible. The add-in's own Message Box Builder is approved future scope, not implemented.

## Permanent independence from the optional tbUI3 package

- Retain the existing TabView/MultiPage implementation and tooling in the add-in; full control-package and designer feature acceptance is deferred to its independent development milestone. Internal IDE prerelease distribution requires non-interference with normal projects, not completed TabView functionality. The overall project remains prerelease until the planned controls are complete and stable release is explicitly approved; independence is a permanent product requirement, not a temporary prerelease workaround.
- Confirm native isolation on BETA 1043 through 1045. Test ordinary projects with the package installed but unreferenced, disabled or unresolved references, no project, project switches and reference removal/re-enable. Verify no stale MultiPage UI or hooks and exercise ordinary form editing and Save in all toolbar modes and both presentations. Source implementation and fixture coverage landed in 0.4.0.6. The four existing BETA 1045 Ribbon fixture failures, including missing File/Save presentation, need resolution or conclusive native acceptance before team deployment. The owner approved development-testing publication of 0.4.0.6 for the 0.4.0.5 upgrade path; initially test natively on BETA 1043 and 1044.

## TabView designer acceptance (deferred independent milestone)

Use [UI3TabView contract](../docs/controls/UI3TabView.md) and [architecture](ARCHITECTURE.md) for the bridge's ownership and lifecycle. Adapter v10 remains the current source checkpoint.

- Verify freshly drawn host + creates exactly one actual saved page, add/select/switch/drop/reorder/delete (including children), save/reopen and undo/redo. Repeat delete/readd on two differently sized hosts and confirm generated members, Properties, bounds, selection and child coordinates; no hidden orphan pages.
- Confirm native page lock protects page geometry against direct movement/resize but allows child editing and host resize; cleanup retains pre-existing locks. Confirm toolbox UI3TabPage hiding across rebuild/unload and normal +/New page authoring; verify optional New Page context verb and property refresh.
- Preserve host-scoped names, avoid automatic renaming of existing code references on host rename/reparenting, and design repeated-name/array identity separately. Confirm Properties-selected child reveal and current overflow behavior.
- If intermittent reference reload/deserialization, snapshot paint exception or wrong temporary HWND size recurs, capture exact native stage and diagnostics before changing stored data or layout. Recheck private designer APIs per beta and replace with supported APIs when available. Keep final win64 smoke and actual native evidence.

## Theme and optional styling follow-ups

- Test both themes and current styling in BETA 1045 and recheck theme property map/selectors and private host hooks with each later beta. Verify menus, dialogs, text fields, Options, docking margins, headers, code tabs, context menus, hover, Windows accent and titlebar, no overflow/gaps; use [native theme and styling checks](PHASE1_HANDOFF.md#native-theme-and-optional-styling-visual-checks).
- Remaining enhancements: property sheet list-row styling, possible accent Open button (requires approval), Segoe UI Variable across remaining surfaces, Monaco hover/scrollbar theme and other host-fixed details. If host blocks page access, retain standalone themes and Classic fallback; do not modify vendor IDE files for styling.
- Exploratory upstream theme-property requests (only with approval), static accent variants and optional syntax palette. Fluent toolbox icon replacement was explicitly dropped: each control owns its toolbox icon.

## Deferred installation-manager milestones

[Installation Manager specification](INSTALLATION_MANAGER_SPEC.md) owns approved constraints. Phase 2: InstallAlongside and ArchivePrevious strategies, configurable cross-volume archive locations and archive/new/both custom-content routing. Phase 3: conservative installation discovery/reorganization, optional shortcut management and advanced historical add-in override after loader behavior is verified. Do not expand Phase 1 to include them.

Restore the visible stable/development channel selector only once a genuine stable twinBASIC channel exists. Consider optional control-package distribution when real release assets exist (never silently rewrite embedded packages), working-directory/launch-context capture where supported and automated release CI after native acceptance.

## Development release retention

- After the updater is accepted as reliable, inventory obsolete/defective prereleases and their asset dependencies, identify a known-good recovery release and retain versions needed for upgrade/rollback/compatibility testing. Propose a cleanup list for owner approval under the [versioning policy](../docs/VERSIONING_POLICY.md). Preserve tags by default, Git history and changelog evidence; never reuse published versions. No release deletion is authorized or completed by this roadmap entry.

## Public distribution hygiene

- **Complete compiled-resource sanitization before distribution.** The canonical updater and CSS mirror now contain neutral wording. Rebuild the Win32 helper, repeat native self-test/startup acceptance, run `prepare-phase1-bundle.mjs` with the freshly accepted EXE, rebuild both DLLs and verify exact compiled payloads. The previously accepted executable and embedded payload are superseded for distribution; their bytes and historical evidence are retained until replacement. Bundle/project resource equality checks are expected to fail until the rebuild and re-embedding are completed. Never patch compiled EXE bytes or relax verification. Audit other source, metadata, tracked logs and generated artifacts for prohibited identifiers under AGENTS before distribution.

## Documentation maintenance

Keep current status in the handoff, product decisions in the specification, implementation contracts in the technical references and history in CHANGELOG. The retired preliminary plans are in Git history; do not recreate competing sources of truth. Retain older candidate notes in Git history; do not treat old version checkpoints as pending tasks. The root [ROADMAP](../ROADMAP.md) owns the separate core package migration.
