# Phase 1 implementation ownership and integration contract

2026-11-23, Shane's explicit parallel-work direction. The consolidated INSTALLATION_MANAGER_SPEC.md remains authoritative.

- **Quill:** owns only `tbIDE/prototypes/welcome-wizard/`, including its functional wizard, accessibility and documented integration interface. Cody must not modify this directory.
- **Cody:** owns active production add-in/native updater source, canonical projects/mirrors, offline bundle provisioning, shared deployment, per-installation settings and recovery, IDE Options installation settings, packaging, validation and final integration. Preserve Quill's prototype intact; adapt its documented interface from production integration code.
- No independent competing production Welcome Wizard is to be shipped. Prototype completion is not native integration acceptance. Neither owner publishes a release, opens a PR or merges main.

## Native services available to the wizard adapter

Production bridge requests are structured objects from the add-in-hosted JS queue; no filesystem paths, executable names, arbitrary commands or update approvals are accepted from the wizard.

| Intent | Payload | Native effect |
|---|---|---|
| `choose-theme` | `name`: exact `WinUI3 Light` or `WinUI3 Dark` | Reload actual IDE theme list, select/persist via the verified BETA 1045 IDE APIs, acknowledge actual result. No selection during preview. |
| `choose-toolbar` | `name`: exact `Classic`, `Hybrid`, `Ribbon` | Existing toolbar controller and the existing per-user toolbar setting. |
| `installation-preferences` | Optional Boolean `automatic`, Boolean `restart`, `channel`: `development` or `stable` | Persist versioned preferences for the originating installation; synchronize existing update UI. |
| `welcome-record` | `schema`: 1; `disposition`: `completed` or `dismissed` | Persist user-global Welcome completion, independently of bootstrap and per-IDE settings. |
| `bootstrap-retry` | none | Offline recheck/repair of missing/recognized bundled assets. Never overwrites unknown/customized files. |
| `repair-resource` | exact resource `id`: `updater`, `themeDark`, `themeLight`; `confirmed`: true | Explicit reset retains a verified backup before replacing a customized resource. Never downgrades a newer updater. |

State snapshots (schema 1): `root`, `installationId`, `preferences` (schema 1, strategy `InPlace`), actual `theme` and `toolbar`, `bootstrap` (`status`, `message`, `resources[]`), `message` (native acknowledgement/error), and `recovery` (whether an unfinished native transaction is available). Resource entries carry `id`, `path`, `status`, `message`, `repairable` and an optional retained `backup` path. The wizard must show native errors instead of assuming a queued setting has succeeded.

Automatic online opt-out does not disable bootstrap or manual checks. Wizard completion is per user; preferences and transaction approvals are per installation. Future schemas are preserved instead of overwritten by an older wizard. Native updater production compilation and binary payload generation remain acceptance/build steps; a resource must never be replaced by a mock EXE.

The prototype may choose its own documented JavaScript mounting API. The production adapter will translate that API to these native services and feed acknowledged snapshots back. Quill's committed interface documentation is the integration authority for its view lifecycle.
