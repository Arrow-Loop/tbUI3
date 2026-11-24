# Phase 1 implementation ownership and integration contract

2026-11-23, Shane's explicit parallel-work direction. The consolidated INSTALLATION_MANAGER_SPEC.md remains authoritative.

- **Quill:** owns only `tbIDE/prototypes/welcome-wizard/`, including its functional wizard, accessibility and documented integration interface. The production agent must preserve this approved prototype unless Shane requests view changes.
- **Production agent (currently Claude, following Cody's implementation pass):** owns active production add-in/native updater source, canonical projects/mirrors, offline bundle provisioning, shared deployment, per-installation settings and recovery, IDE Options installation settings, packaging, validation and final integration. Preserve Quill's prototype intact; adapt its documented interface from production integration code.
- No independent competing production Welcome Wizard is to be shipped. Prototype completion is not native integration acceptance. Neither owner publishes a release, opens a PR or merges main.

## Native services available to the wizard adapter

Production bridge requests are structured objects from the add-in-hosted JS queue; no filesystem paths, executable names, arbitrary commands or update approvals are accepted from the wizard.

| Intent | Payload | Native effect |
|---|---|---|
| `choose-theme` | `name`: exact current installed-theme inventory member | Reload actual IDE theme list, select/persist via the verified BETA 1045 IDE APIs, acknowledge actual result. No selection during preview. |
| `choose-toolbar` | `name`: exact `Classic`, `Hybrid`, `Ribbon` | Existing toolbar controller and the existing per-user toolbar setting. |
| `installation-preferences` | Optional Boolean `automatic`, Boolean `restart`, `channel`: `development` or `stable` | Persist versioned preferences for the originating installation; synchronize existing update UI. |
| `welcome-record` | `schema`: 1; `disposition`: `completed` or `dismissed` | Persist user-global Welcome completion, independently of bootstrap and per-IDE settings. |
| `bootstrap-retry` | none | Offline recheck/repair of missing/recognized bundled assets. Never overwrites unknown/customized files. |
| `repair-resource` | exact resource `id`: `updater`, `themeDark`, `themeLight`; `confirmed`: true | Explicit reset retains a verified backup before replacing a customized resource. Never downgrades a newer updater. |

State snapshots (schema 1): `root`, `installationId`, `preferences` (schema 1, strategy `InPlace`), actual `theme` and `toolbar`, `bootstrap` (`status`, `message`, `resources[]`), `message` (native acknowledgement/error), and `recovery` (whether an unfinished native transaction is available). Resource entries carry `id`, `path`, `status`, `message`, `repairable` and an optional retained `backup` path. The wizard must show native errors instead of assuming a queued setting has succeeded.

Automatic online opt-out does not disable bootstrap or manual checks. Wizard completion is per user; preferences and transaction approvals are per installation. Future schemas are preserved instead of overwritten by an older wizard. The accepted helper and themes are embedded; compiled DLL verification remains required. A resource must never be replaced by a mock EXE.

The prototype may choose its own documented JavaScript mounting API. The production adapter will translate that API to these native services and feed acknowledged snapshots back. Quill's committed interface documentation is the integration authority for its view lifecycle.

## Integrated source candidate

The production adapter adds correlated request ids/acknowledgements, modal HTML hosting, scoped Windows theme/accent tokens and Promise-based explicit repair confirmation. Actual native state is published after settled requests. See [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md) and [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md).

## Approved Toolkit view integration through 79be9e5

The production adapter now embeds welcome.js, welcome.css, the full master.css and controls.js unchanged, with hashes in tbUI3IDE/WELCOME_REFERENCE.json. Shared component assets initialize only inside the same-origin iframe; the outer HTML dialog retains modality. Native InstalledThemeCatalog resolves data from the actual IDE loader's both-directory list and parent links. Only validated hex preview fields enter view snapshots; no raw theme text or arbitrary CSS enters the iframe. Exact inventory names gate selection. Native status vocabulary is projected into Quill's health contract, including conditional Setup and theme-discovery errors. Channel selectors are removed in both wizard and production settings; roadmap return remains deferred. Prototype sources remain Quill-owned and unmodified by Cody.

For current native evidence, embedded payload status and remaining acceptance, see [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md). The prototype is approved; production integration and acceptance continue with the active development agent.
