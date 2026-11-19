# Prerelease version numbering and historical correction

Decision: 2026-11-19. Status: **approved convention; metadata migration pending coordinated canonical project update**.

## Convention

Each first-party independently versioned component in this repository stays below major version 1 until its **own** first officially designated stable release. The first stable release starts at `1.0.0.0`. Existing minor, build, and revision components are preserved when correcting an erroneously used major version. GitHub "prerelease" status remains explicitly set on development releases.

Current proposed identities:
- tbUI3IDE: `1.3.0.20` as originally recorded => `0.3.0.20` as corrected prerelease identity; prospective release tag `tbUI3IDE-v0.3.0.20`.
- tbUI3 control package: `1.0.0.75` as originally recorded => `0.0.0.75` as corrected prerelease identity; any future control-package release must have its own tag namespace.
- Earlier tbUI3IDE `1.1.x.x`, `1.2.x.x`, and `1.3.x.x` correspond to `0.1.x.x`, `0.2.x.x`, and `0.3.x.x` respectively; earlier tbUI3 package `1.0.0.x` corresponds to `0.0.0.x`.

**Historical truth:** Earlier development builds and changelog entries really used the original `1.x` numbers. Do not rewrite Git history, erase evidence, claim previously shipped binaries contained different metadata, or bulk-rewrite source references to unrelated upstream/third-party versions. Where historical documents describe actual builds, retain original identity or annotate it as `original version X (retrospective prerelease designation Y)`. A new dated correction explains the mapping.

## Scope boundaries

Apply this version rule to first-party tbUI3IDE and tbUI3 control package. Audit other first-party deliverables individually before modifying them. Do not renumber official twinBASIC releases, third-party package references, WinRT/WinUI versions, Fluent icon assets, test fixtures owned by upstream projects, or the separate tbUI3-Libraries resource-pack version merely because it uses another version convention.

The `tbUI3Test` embedded `Packages/tbUI3/Settings` and parent `project.references` must match the canonical control-package version. Likewise, the add-in's packed `tbUI3IDE.twinproj` must match `tbUI3IDE/src/Settings`. Do not change source mirrors alone. Preserve existing class/interface/designer/project IDs.

## Coordinated migration checklist (not yet executed)

1. Coordinate with the concurrently active updater implementation on `tbui3-dev` and avoid editing its in-flight source/manifest files. Use one synchronized branch head and reconcile other agents' commits before assembly.
2. Change canonical `tbIDE/tbUI3IDE/tbUI3IDE.twinproj` versionMajor from 1 to 0; synchronize its `src/Settings` mirror. Do not change minor/build/revision.
3. Change canonical `tbUI3/tbUI3.twinproj` package versionMajor from 1 to 0; synchronize the exact package settings mirror while preserving its LF line endings.
4. Update canonical `tbUI3Test/tbUI3Test.twinproj` embedded package Settings and parent package reference to `0.0.0.75` or the actually current release revision when migration occurs; regenerate matching mirrors. Check any additional test/repro package references explicitly.
5. Audit first-party version constants, metadata embedded into generated assets, tests, package version checks, release manifests and current-state docs for **current** version values. Keep third-party `1.x` values unchanged. Update tests for the corrected values without distorting archived observations.
6. Add compatibility handling to the updater so installed historical `1.3.x.x` development builds can migrate to `0.3.x.x` without being incorrectly ranked as newer stable releases. Restrict this alias to known historically mislabeled first-party prerelease builds; don't globally redefine version ordering.
7. Verify canonical projects/mirrors/embedded package references agree. Record any actual compilation or runtime results distinctly, then publish the prerelease with corrected tag and binary metadata.

Only the policy/documentation audit is completed by this document. It does **not** claim the canonical packed projects, binaries, test copies or updater have already been migrated.
