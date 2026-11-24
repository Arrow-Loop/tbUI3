# tbUI3IDE updater and installation manager: authoritative product and implementation specification

**Current implementation and testing:** [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md) is authoritative for actual acceptance, not this product requirements document.

**Decision owner:** Shane. **Conversation decision window:** 2026-11-19 through 2026-11-24. **Status:** Approved product behavior and staged architecture; current implementation and validation are tracked in the Phase 1 handoff. **Branch:** `tbui3-dev`; do not merge to `main` or publish a release without Shane's authorization.

**Start here for Cody, Claude, or any incoming agent.** This file captures the decisions and reasoning from Shane's multi-step design discussion so no earlier ChatGPT conversation is needed. Read it alongside [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md), [Updater/README.md](Updater/README.md), [ROADMAP.md](ROADMAP.md), [CHANGELOG.md](CHANGELOG.md), repository [AGENTS.md](../AGENTS.md), and the applicable **current** `Arrow-Loop/twinBASIC-Knowledge` main-branch standards. If prose in older documents describing the **previously planned** bootstrap/deployment conflicts with this spec, this dated decision supersedes that prior *plan*, not the reality of existing source. Preserve and document the current implementation separately until the approved migration is completed.

## 1. Product goal and priority

The updater should get into actual use quickly, for twinBASIC developers and the wider public community. Shane prefers unobtrusive, low-interaction updates: users install only the DLL(s), configure preferences once, and ordinarily see a notification/approval rather than repetitive configuration questions. There must be a real, safe option for users following Wayne's recommendation to retain separate twinBASIC beta installations, **without making that advanced functionality a first-release blocker**.

The original plan favored direct overwrite. The **agreed default/recommended IDE update strategy remains in-place**, with verified backups and rollback; users can later choose to install alongside or archive previous versions. Distinguish **updating the official twinBASIC IDE** from **updating the add-in, bundled updater, themes and resource library**. These are independent versioned components with appropriate release metadata and consent. The public GitHub repository alone does not provide downloadable binaries; a deliberately published prerelease and verified manifest/assets are required.

### Release phases (binding sequence)

| Phase | Required deliverable | Not a prerequisite |
| --- | --- | --- |
| **Phase 1, first public production release: combine former phases 1 + 2** | Native twinBASIC updater engine validated end-to-end; safe transactional **in-place** IDE update; release manifest/assets; per-user add-in DLL placement; embedded updater and Light/Dark themes with silent, verified startup provisioning/repair; shared per-user `Updater.exe`; per-installation identity/settings isolation; IDE Options and embedded HTML/CSS/JS Welcome Wizard; no extra user-installed EXE | Alongside/archive actions, drive-spanning archive moves, broad installation discovery/reorganization, shortcut rewriting, historical add-in overrides |
| **Phase 2: additional update strategies** | Install Alongside; Archive Previous Version; user-configurable target/archive root and naming, including different drives; actual verified-release inventories and additional-content routing/preservation; safe recovery | Broad discovery/reorganization |
| **Phase 3: installation manager** | Conservative discovery/registration of existing portable installations; optional, explicit, previewed reorganization; optional shortcut-review/repair; advanced compatibility for archived IDE-specific add-in | Never necessary for ordinary in-place updating |

### Component and update consent contract

Discover the official twinBASIC portable IDE from its official published release source, the independently versioned tbUI3IDE architecture DLLs and updater, WinUI3 Light/Dark themes, and the developer-only icon/resource library using its existing published manifest (`Arrow-Loop/tbUI3-Libraries`, `icons/manifest.txt`). Preserve the icon picker's Setup install/update/reinstall/uninstall behavior and existing shared install state. Optional control TWINPACK distribution is separate; never silently rewrite consumer projects or their embedded package references. One unavailable release source must not suppress independently available components. Do not ship private credentials or execute arbitrary branch/download contents.

Expose installed/available versions and selection; automatic checks fetch metadata, not authorization. Update Now starts the updater-owned transaction and coordinates normal IDE shutdown; Update on Exit arms the normal-exit bridge immediately on selection, independently of staging completion; Remind Me Later persists deferral without closing/installing. A canceled save/exit or abnormal termination cannot authorize writes. Keep verified staging outside destinations, bounded waits and retry/cancel; verify disk space, locks and permissions, retain durable backups/journal before writes, verify results, restore on failure and preserve recovery evidence if rollback fails. Optional restart targets the originating executable and launch context where supported. Never claim all-component success when a required component failed.

The detailed native contract, including schemas and scoped worker behavior, is in [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md); live acceptance is in [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md). The original beside-IDE helper and preliminary bootstrap plans are superseded and retained in Git history, not separate current instructions.

**Architecture-first rule:** Phase 1 may provide just the `InPlace` strategy implementation, but must establish stable, versioned boundaries for installation identity, per-installation settings, verified release inventory, update planning, transaction operations, and shared-updater execution, so Phase 2/3 extend rather than replace Phase 1. Do not build speculative full Phase 2 features into Phase 1.

### Binding application ownership (approved 2026-11-24)

This is a Phase 1 architectural correction, not a new optional feature or an assertion that the migration has already been implemented. It supersedes the previous split update-review UI and add-in-orchestrated Check/Stage/Apply workflow. There must be **one updater UI, one transaction owner and one native engine**.

| Owner | Responsibilities |
| --- | --- |
| tbUI3IDE DLL | IDE integration, Welcome Wizard and its initial preferences, offline embedded-resource provisioning/repair, registering the originating IDE, discoverable Check for Updates/settings entry points, launching the recognized updater in the appropriate mode, and the minimal trusted native save/discard/cancel/exit bridge. |
| Updater.exe | Automatic/manual release checks, scheduling/deferral and ongoing update preferences, update-available toast/notification (including an IDE-adjacent presentation), update review/component selection/consent, Update Now/On Exit/Later, downloads, extraction, verified staging, visible progress, cancellation, shutdown coordination, process/lock checks, installation, backups, verification, rollback/recovery, optional restart and detached self-update. |

The add-in must not host a second update toast, selection dialog, update transaction/progress view, or own the Check/Stage/Apply state machine. Its Wizard and offline repair functionality remain usable even when the helper is missing or unrecognized. IDE settings/commands that concern ongoing updates open the updater-owned settings/review, with the Wizard allowed to initialize the same versioned settings through a narrow adapter. No duplicate preferences authority or second release-check scheduler. Existing approved WinUI 3 designs, shared Toolkit tokens/controls and native updater engine are reuse candidates; relocation, not another competing UI, is the goal.

On IDE startup the add-in can invoke the recognized helper in quiet check mode with verified originating context. Updater.exe decides whether a check is due or opted out, exits silently when no notification is appropriate, and owns the notification if a relevant update exists. Opening that notification or manually checking opens its standalone review. It may appear visually associated with the IDE but must not depend on the IDE DOM remaining alive. Coalesce concurrent checks/notifications and maintain installation-specific scope. Do not launch an arbitrary unrecognized executable.

**Update Now:** the standalone updater owns consent, staging and progress, requests normal save/exit through the narrow add-in bridge, and continues independently after approved exit. Never cover a native IDE save/discard/cancel dialog with an update modal or replace the IDE's save handling.

**Update on Exit:** arm the bridge and persist the exact selected request immediately when consent is accepted, before lengthy downloads, extraction or plan generation. Clearly acknowledge that the request is armed. The user may then exit normally while staging is underway; the updater must continue on its own, with visible progress as appropriate. Do not require a live IDE after the save/exit acknowledgement or block ordinary exit until staging completes. A close occurring before arming is acknowledged must fail safe, not fabricate consent.

Separate early shutdown acknowledgement from final verified-plan authorization. The former must be bound to the exact originating installation, process/session identity, immutable selected release/asset identities and user-approved request; only the native accepted save/exit continuation may provide it. The updater may authorize final writes only after verifying the complete plan corresponds to that same request, validating the acknowledgement, confirming relevant processes have exited, rechecking cancellation and satisfying all existing plan/destination/rollback/elevation gates. A canceled save or exit, stale session, changed selection/asset/plan, missing acknowledgement, uninspectable process identity or abnormal termination before approval cannot authorize installation. Version and test the new handshake explicitly; do not simply relax the existing plan-bound approval check or synthesize approval in the helper. Preserve protocol compatibility or reject incompatible peers safely.

Report stage-level progress (release checks, download, extraction, baseline inventory, verification, waiting for shutdown, install and recovery), and make lengthy operations responsive with meaningful progress and cancellation. Measure extraction/baseline overhead before optimizing; retain verified inventories, hashes and all path/ZIP safety rules. Capture process identity while it is live, distinguish exited/reused PID from genuine access or inspection errors, capture native error codes immediately, and retain safe failure when uncertain. Add lifecycle diagnostics for both peers, including stage durations, request/session correlation, bridge arming, native exit/cancel/acknowledgement, worker launch, process wait and result; do not log credentials or private data unnecessarily.

## 2. First installation and actual folders

**Preferred public installation:** User manually installs only their architecture-matching `tbUI3IDE.dll` file(s) into the *per-user* directories, **subject to first verifying actual twinBASIC search/load semantics**:

```text
%APPDATA%\twinBASIC\addins\win32\tbUI3IDE.dll
%APPDATA%\twinBASIC\addins\win64\tbUI3IDE.dll
%APPDATA%\twinBASIC\themes\WinUI3 Dark.theme
%APPDATA%\twinBASIC\themes\WinUI3 Light.theme
%LOCALAPPDATA%\tbUI3\Updater\Updater.exe
%LOCALAPPDATA%\tbUI3\Updater\Installations\<Installation-ID>\...
```

- Every Win32/Win64 add-in DLL embeds the **same** portable Win32 native `Updater.exe` and the exact two theme files as verified binary resources. Install only the DLL that matches a given IDE architecture or both for users of both architectures. No separate EXE, loose UI resources, setup binary, PowerShell runtime, or theme copying during first install.
- Add-in bootstrap runs on **every load**, independent of whether the Welcome Wizard has already been completed or online update notifications are disabled. Missing managed resources are silently provisioned when safe, before first-run onboarding; failures must not prevent access to the wizard. Same verified version => no action; installed newer updater => **never downgrade**. Recognized older unmodified resource => safely upgrade when not in use; unknown/modified resources => retain and offer an explicit repair/reset choice. Preserve user-customized themes, active theme selection and toolbar preferences.
- `Updater.exe` is a **per-user, machine-local executable** under `%LOCALAPPDATA%`, not roaming `%APPDATA%`. Themes and add-in DLLs live in roaming `%APPDATA%` paths if host loading is confirmed. One updater EXE is shared by all IDE installations for that Windows user, while their state is distinct.
- Use resource version + SHA-256 verification, atomic replacement, cross-process lock, canonical path validation, no reparse-point escape, fail-safe warnings for locked/corrupt/unrecognized files. A newer or older add-in launched from a second IDE must not downgrade or corrupt the shared helper. Preserve updater self-update and recovery semantics.
- Bootstrap must work offline and not require admin elevation even if IDE is in `Program Files`. Installing the initial DLL into a protected IDE-local directory, if the user chooses that route, may itself require permission; preferred per-user add-in location avoids this.
- **Validate before committing to AppData DLL strategy:** Does twinBASIC load user add-ins on all supported builds? What is the load order if the same add-in exists in user and IDE-local addins? Can *both* copies load? What happens with different versions and older IDEs? Do not rely on an already-loaded DLL deregistering itself to avert duplicate commands or event handlers. Prefer preventing duplicate loads, clearly documented compatibility gating, and an advanced explicit local override only if host behavior is confirmed.

The current deployment contract and remaining live acceptance are described in [PHASE1_HANDOFF.md](PHASE1_HANDOFF.md) and [INSTALLATION_CONTRACTS.md](INSTALLATION_CONTRACTS.md). The former beside-IDE helper placement is superseded.

## 3. Multiple IDE roots and state model

Portable twinBASIC installs may use **arbitrary drives, folders and names**, including entirely unrelated paths. Do not infer installation ID or strategy from a folder named `tb1044`; identify each running IDE by actual normalized/canonical executable/root path, and verify the genuine executable/build. Define deterministic, collision-resistant installation IDs; consider rename/move aliasing and user-approved registry migration without silently conflating installations.

- `%LOCALAPPDATA%\tbUI3\Updater\Installations\<Installation-ID>` holds versioned per-installation preferences and installation receipts, source/root identity, approved destination and naming options, active/pending update state, journals, transaction backups/recovery metadata, last verified official-file inventory and per-installation component versions as appropriate.
- User-global state may include Welcome Wizard schema/completion, shared dependency versions and a registry of previously seen IDE roots. **Do not** let one IDE's selected beta, channel, approved installation strategy, deferred update or restart overwrite another's.
- Register each IDE root reliably when the add-in starts. Multiple IDE sessions and both add-in architectures can coexist; guard shared resource provisioning and per-installation transactions with appropriate cross-process locking. An update or shortcut operation must be explicitly scoped to the selected IDE/root, never to every discovered installation.
- Prefer minimal user interaction. The updater owns ongoing defaults/overrides; IDE Options provides entry points and the Welcome Wizard can initialize preferences. Operational update approval remains a separate consent. An opt-out of automatic online checks does not suppress offline bootstrap or a manual check.
- A verified public add-in release must specify compatible IDE builds; an old preserved IDE may be unable to host the latest shared add-in. Fail gracefully and do not pretend that local-vs-shared add-in precedence is known until verified.

## 4. Three IDE update strategies

**A. `InPlace` (Phase 1, default and recommended)**: Obtain consent for selected verified release identities; stage and verify the official release under updater ownership; coordinate IDE save/discard/cancel shutdown independently of staging completion as specified above; wait for the owning IDE and relevant compiler processes to exit and validate the final plan-bound authorization; only then atomically replace allowlisted release files with backup, verified journal, rollback and optional restart at the **same executable path**. Preserve unrelated/add-in/preferences/user files. This is intentionally a different approach than Wayne's clean-folder beta recommendation and must be validated for package layout changes.

**B. `InstallAlongside` (Phase 2)**: Install a new verified official distribution into a **new** versioned folder without altering any existing installation. Example user layout (arbitrary names/drives):

```text
C:\twinBASIC\tb1044\twinBASIC.exe
C:\twinBASIC\tb1043\twinBASIC.exe
C:\twinBASIC\tb1042\twinBASIC.exe
```

An update to 1045 might create `C:\twinBASIC\tb1045\twinBASIC.exe`. Naming pattern, root, install path and shortcut creation are configurable, not hardcoded. Never silently redirect old shortcuts, file associations or old IDE projects. After install, offer to launch the new IDE and optionally create a separately named shortcut.

**C. `ArchivePrevious` (Phase 2)**: Preserve an **entire existing portable IDE installation**, including add-ins, user-created folders, custom files and configuration, then deliver the fresh official release to a stable primary location. Example:

```text
C:\twinBASIC\twinBASIC.exe             (new current build)
C:\twinBASIC\versions\tb1043\twinBASIC.exe  (old archived build)
```

**Do not restrict archives to a built-in vendor-file allowlist.** Users may have necessary custom resources. The archive destination may be an entirely different drive, including `D:\twinBASIC Archives\tb1044\`, or a suitable accessible network share with appropriately conservative checks. Avoid recursively archiving an archive, other IDE installations nested beneath the root, linked directories or unrelated sibling data. Use exact preview and consent when directory boundaries are ambiguous.

- Same-volume directory renames may be suitable if safe; cross-volume archival is **not atomic**. Copy to destination staging, validate hashes and completeness, flush a durable journal, then finalize, and only remove original content after verified success and appropriate user consent. On inability to finish, retain an intact original or recoverable copy and report state.
- **Additional content (e.g. `MyCustomFiles\`, `MyTools\`, `Projects\`) needs per-folder/file policies:** `ArchiveOnly`, `NewOnly`, `Both` (recommended default for recognized user-owned content), or `LeaveUnmanaged` where appropriate. User can choose that custom content remain available beside the *new current version*, be available with the *archive*, or be **copied to both**. Do not make “archive everything” imply that essential custom directories disappear from the active IDE.
- For archive preservation, include non-vendor content by default, but permit an explicit review of unfamiliar files and user overrides; keep unchanged content when user requests it. If moving just a subset, preserve leftovers and make resulting mixed directory state clear. No silent deletion to “tidy up.”
- Specific rules can be remembered for future operations only under conditions for which they were approved; changed contents, destination collisions or unknown ownership trigger a targeted review. Do not ask the same questions every update.

## 5. Verified release inventory and classification

Every official twinBASIC GitHub release may introduce, rename, remove or reorganize folders, regardless of what the current updater expects. **Do not hardcode an exhaustive static map of what vendor subdirectories are “allowed.”**

For every update:

1. Fetch a specific **official published** release/asset through the verified source, check release/build identity, hash, signing where available, size, download/redirect safety and archive structure. Never treat a branch checkout as an installable release.
2. Strictly validate archive paths, name collisions, traversal, absolute/drive/ADS/device paths, symlinks/reparse points, duplicate case-insensitive paths, unsafe file types and destination containment. A **dynamic inventory** of verified vendor paths is data, not authority for arbitrary writes. New official subdirectories may be valid; the safety policy must remain strict.
3. Build a version-specific inventory of every official file/folder from this **actual release**, plus its verified hash/length. Compare to a **previous known official baseline** (existing release receipt or authenticated older official archive) and to on-disk content. Do not assume a currently unfamiliar folder is user-created, or that a newly appearing vendor folder is malicious solely for being new.
4. Classify at least: unchanged official, updated official, newly added official path, previously official but now absent, modified official, recognized user-added content, unknown/ambiguous content, vendor/user path collision, junction/external path and locked files. When baseline evidence is unavailable, classify conservatively.
5. Apply strategy-specific plans and user preservation rules without weakening hash/allowlist/transaction validation. New vendor files from a verified release can be installed into safe, contained paths after conflict checks, even if their directory did not exist in older releases. Never overwrite user-owned content or delete “obsolete” files just because they are missing from a new archive; retire verified obsolete files only through an explicit safe policy.
6. Record the actual inventory and classification decisions in the durable transaction plan/receipt. UI should explain uncommon conflicts while routine changes remain silent after approval.

The existing updater currently uses a narrower set of vendor directories (`bin/`, `ide/`, `locale/`, `packages/` and launcher), as documented in [Updater/README.md](Updater/README.md). **Phase 1 must define the extensible inventory/safety contract** but need not ship full unknown-folder management or generalized archive classification. Any broader dynamic write behavior must be security-reviewed and tested before enabling it.

## 6. Discovering existing installations and optional reorganization (Phase 3)

Shane identified two common layouts (examples only): (1) sibling version folders under a parent; (2) active `twinBASIC.exe` in the root and older versions inside a nested `versions` folder. **Neither is assumed; arbitrary locations are supported**.

- **Reliable input:** each running IDE's actual executable path registered by the add-in; previously approved installation inventory.
- **Best effort only:** examine a small, bounded set of nearby parent/sibling directories and standard shortcuts/user-specified search locations, verifying executable identity and version. Do **not** crawl all drives or assume names. Allow a user to browse to and register missed installations.
- Discovering a candidate must never add it to automatic update transactions, reorganize it, delete it or alter its shortcuts. Display version, location, last seen, current/running/locked status, and confidence/verification of identity.
- Offer an explicitly user-invoked **Reorganize Existing Installations** wizard, including upon first management setup when multiple genuine installs are found; **never pop it up on each update or merely because another folder appeared**.
- Wizard previews exact source/destination for each selected installation, conflicting or unknown folders, preserve-in-old/new/both choices, required free space, same- vs cross-volume operations and file/shortcut implications. Require final affirmative approval before transfers. Never infer historical folder intent simply from name.
- Warn clearly that moving portable IDE installations can break shortcuts, scripts, taskbar pins, custom project references or other tools. Offer **optional separately reviewed** shortcut updating for ordinary shortcuts the program can safely identify. Do not scan/rewrite arbitrary scripts or project files. Do not silently change file associations.
- Maintain recovery journals and explicit results; user decisions about layout and future naming are stored in settings, but existing folders are only moved when specifically approved. A user may choose to leave current divergent layouts untouched forever.

## 7. IDE Options, onboarding and interaction policy

**IDE Options entry points:** retain discoverable `Check for Updates`, installation settings/repair and Welcome reopen commands (adapt exact placement to native IDE options structure). Ongoing update settings and review open in Updater.exe; offline provisioning repair and Welcome remain in the add-in. Persist preferences under `%LOCALAPPDATA%\tbUI3\Updater\` with schema version and per-installation scopes. Suggested fields:

| Setting | Scope | Default |
| --- | --- | --- |
| IDE update strategy | Per installation | `InPlace` recommended |
| Update channel / automatic checks / remind later | Per installation or explicitly user-global when appropriate | Follow existing user selection; auto checks on unless disabled |
| New install parent and versioned folder naming pattern | Per installation | Set during Phase 2 configuration, no guessed path |
| Archive destination and naming (different drive allowed) | Per installation | Explicitly user-configured |
| Handling of user-created additional content | Per installation + folder overrides | `Both` for recognized user-owned content in archive workflow; otherwise preserve/ask |
| Ask about newly ambiguous/conflicting items | Per installation | Yes, only if safe automatic resolution is impossible |
| Conservative discovery of other IDE roots | Per user | Optional/quiet, no automatic management |
| Shortcut creation/repair | Per operation or saved limited policy | Off without explicit user approval |
| Welcome completion/dismissal schema | Per user | Show once, then accessible for replay |

**No recurring interrogation.** After initial configuration, ordinary update flow only shows update information, consent and progress. Saved policies should handle familiar content. Ask only for a new hazard or decision that cannot be safely inferred, such as a collision, locked directory, missing archive drive, changed custom content, ambiguous root, protected-directory elevation or mismatch in trusted release metadata. Do not silently switch update strategy just because multiple installations were discovered.

**Welcome Wizard** is HTML/CSS/JS hosted inside the add-in's IDE DOM, in the existing WinUI3 visual language; do not require the updater EXE or a separate WebView2 bootstrap to show it. Separate from missing-file detection; a deleted theme should silently repair, **not** replay onboarding. Wizard pages:

1. Welcome: tbUI3IDE purpose and capabilities.
2. Automatic/manual updates: IDE and add-in updates, themes/resources, default once-daily metadata checks, opt-out, explicit Update Now/On Exit/Remind Me Later consent; make no promise of silent downloaded updates.
3. Themes: feature WinUI3 Light/Dark, enumerate all effective installed themes from AppData and the active IDE, and render compact previews from resolved paint data. Selection is opt-in; retain the current theme unless chosen.
4. Classic/Hybrid/Ribbon toolbar modes: preview + actual setting control.
5. Features: explain actual add-in capabilities and where to find IDE options/commands, without marketing core-library controls.
6. Finish: compact, extensible preference confirmation and where to reopen the wizard. No installation health dashboard.

Insert Setup directly after Welcome only when native resource/recovery status requires attention; omit it entirely for healthy installations. Repair/recheck uses native authority. Use one isolated wizard iframe with one shared Toolkit runtime and lightweight schematic theme/toolbar previews, not a full IDE or Ribbon instance per preview. Hide the channel selector until a genuine stable twinBASIC channel exists.

Provide **Welcome to tbUI3IDE** via discoverable Help/add-in/IDE Options entry. Store completion by wizard schema version. A future `What's New` view can reuse rendering infrastructure; not a first-release blocker. Make keyboard navigation, focus and accessibility credible, respect Windows light/dark/accent, and support skip/back/revisit. Bootstrap failure should not prevent wizard; wizard must show actual provisioning status rather than false success.

**Protected installation:** Silent bootstrap in per-user dirs should not require elevation. A downloaded IDE update that modifies protected `Program Files` paths may need a separate, user-approved scoped UAC elevation worker, with validated plan and unchanged rollback guarantees. UAC cancellation must leave current installation intact. The scoped elevation workflow is implemented in source; protected-folder native acceptance remains open.

## 8. Shared vs archived add-in compatibility (unresolved host behavior)

Shared `%APPDATA%\twinBASIC\addins` gives all compatible IDEs the same updated add-in and themes; this is preferred for regular users and greatly simplifies parallel IDE folders. Preserving an archived IDE folder with old local `addins` does **not** necessarily preserve the old add-in execution state if a newer user-global add-in is also loaded.

Shane asked whether the AppData add-in could detect the archived local add-in and deactivate itself. **Do not implement self-deactivation as the primary solution without verifying the IDE loader.** It could already have registered duplicate designer/toolbar event handlers before detection. Investigate IDE-local vs per-user search order, duplicate loading, precedence, unloading lifecycle and minimum supported IDE builds. If host supports deterministic local precedence, a local override could be a future advanced preference. If both load, choose a tested prevention/compatibility approach, not an unsafe after-the-fact workaround. Optionally store an environment snapshot recording archived add-in/theme versions for historical fidelity.

## 9. Existing native engine constraints and release packaging

The starting implementation described in [Updater/README.md](Updater/README.md) is native twinBASIC, a Win32 `Updater.exe` with embedded WebView2 UI and separate hidden worker instance; no distributed PowerShell runtime. Keep existing verified transactional concepts: staged checksums, authenticated release metadata and permitted hosts, caller-consent tied to normal IDE shutdown, process wait/lock checks, separate session staging, durable per-file journal/backups, rollback, recovery, optional restart, detached updater self-update, no arbitrary remote commands, no forced kill, no unapproved elevation. The release tool PowerShell is **development tooling**, not shipped runtime.

The first release distributes **one add-in ZIP containing both architecture DLLs with embedded payloads**, a matching schema-2 `tbUI3-update.json` listing only the add-in, and `SHA256SUMS.txt`. Do not publish redundant standalone helper/theme ZIPs. Their independent embedded versions, hashes, protocol and native update support remain intact; future component-only distribution may be introduced deliberately. Bootstrap upgrades recognized older resources on add-in load and preserves newer or customized resources under the existing safety rules. Use the established four-part prerelease naming for the add-in (current source `0.4.0.0`, prior baseline `0.3.0.20`) and updater (current source `0.2.0.0`), adjusting actual future build numbers to match code. GitHub development releases must be marked prerelease and must have the appropriate metadata channel. Historical add-in `1.x` aliases apply only to documented mistaken dev identities, never legitimate future stable releases. **The separate core control package `1.0.0.75` has not been migrated by updater work; do not silently renumber it.** Upstream twinBASIC release versions remain vendor-controlled.

Preserve both add-in architectures, existing project IDs and mirrors, and avoid distributing obsolete `WinUI3IdeStyle.dll`/`TabViewDesigner.dll` alongside the unified add-in.

## 10. Acceptance matrix and developer handoff

**Phase 1 release gate:** (a) current native updater builds and executable self-tests plus live update/rollback/recovery behavior; (b) both DLLs embed correct verified updater/themes; (c) AppData loader/duplicates/older beta compatibility established; (d) first install works with **only add-in DLL(s)**, no network or admin for per-user bootstrap; (e) missing theme or helper restored at later launch, newer updater not downgraded, user-modified theme preserved; (f) two IDE roots/architectures do not share update approvals or corrupt helper; (g) updater-owned notification/review/progress, quiet checks, Update Now/On Exit (including normal exit during staging), save cancel/locks/other IDE/compiler processes, abnormal termination rejection, restart/recovery, rate limit/offline/invalid release metadata; (h) wizard accessible before helper exists, settings persist, no unwanted theme change, skip/reopen; (i) verified release packages and installed DLL PE/manifest identities; (j) protected-folder UAC denial does not damage installation. Test with WinUI3 themes and standard IDE themes. Report real native tests separately from Node/static/browser QA.

**Later gates:** official archive introduces an *unexpected new vendor folder*; old official and on-disk baselines differ; user folder clashes with new vendor name; all three additional-content actions incl. `Both`; archive root on another drive/share, insufficient space/disconnect/partial copy; same-drive rename and cross-drive durable recovery; arbitrary version folder names and layouts; discovery finds candidates but does not act; explicit reorganization preview and shortcut warnings/opt-in; archived IDE with a local old add-in plus shared modern add-in and compatibility gating.

**Implementation handoff guidance:**
- Read current `AGENTS.md`, roadmaps, changelogs, canonical projects and the Arrow-Loop knowledge repo *at the time of work*.
- Coordinate file ownership if Cody/Claude work concurrently. Neither agent should independently change the other's canonical project, Settings mirrors or docs during a reserved pass. Fetch/rebase recent `tbui3-dev` before edits.
- Update `CHANGELOG.md` with only **actual work** and `ROADMAP.md` with pending work at each substantive pass. Keep the paired `tbIDE/` records in sync. Maintain source mirrors, CRLF/Settings conventions and validated canonical project IDs. A documentation decision is not implementation validation.
- If a design conflicts with observed twinBASIC loader/runtime behavior or cannot preserve transaction guarantees, **report that fact and seek Shane's decision** rather than improvising an incompatible behavioral change.
- Do not merge to `main`, create a PR or publish a release without explicit approval. Preserve deferred phase work in ROADMAP rather than quietly deleting it.

## 11. Decision examples and non-goals

**Example 1:** User has `C:\twinBASIC\tb1044\`, `tb1043\`, `tb1042\`. Their future `InstallAlongside` strategy can install `tb1045\` under the user-selected parent while retaining older versions. Do not infer convention from the literal `tb` prefix.

**Example 2:** Current IDE lives at `C:\twinBASIC\twinBASIC.exe`; old versions live under `C:\twinBASIC\versions\tb1043\...`. The `ArchivePrevious` strategy can place old `tb1044` into `versions` before putting the newly downloaded official files at the stable path. Archive destination can alternatively be `D:\Old twinBASIC\`. Do not recursively archive `versions` as if it were part of the active IDE when it is a container for other installations.

**Example 3:** Old IDE contains `MyCustomFiles\`. User wants it beside the archived IDE **and** the new active IDE. `Both` preserves it in both places. If future official release adds `MyCustomFiles\` itself, detect collision and request a targeted decision rather than overwriting one copy.

**Non-goals for the first release:** comprehensive discovery of every possible portable layout, automatic reorganization, automatic deletion of earlier betas, migration/rewrite of user projects, guaranteed full recovery of arbitrary Windows shortcuts, automatic theme activation, automatic downloaded updates without approval, an implicit administrator elevation bypass, and claiming a historical archived IDE automatically uses its historical add-in when shared add-ins load.

## 12. Decisions intentionally left for implementation verification

- Exact per-user add-in loader paths, local/shared precedence and compatibility on target twinBASIC builds.
- Exact schema/format and concurrency protocol for installation IDs, preferences and release inventory.
- Safe handling of `Updater.exe` elevation for protected IDE paths without violating verified-plan and worker security.
- Concrete old-version inventory acquisition/receipt rules, upstream release reshaping and signed trust/fallback.
- How much of advanced directory inventory planning is feasible in Phase 1 without delaying release.
- Whether a future external network archive destination is safe enough to support initially, and which filesystem features it must reject.
- Exact UI location/terminology of the installations panel and Welcome Wizard command in each IDE toolbar mode.

These are **open technical questions**, not permission to substitute a guessed policy. Resolve from actual IDE/API behavior and test evidence, with Shane deciding materially different UX or safety choices.
