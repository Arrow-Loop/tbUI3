# Developer handoff

This file is a navigation entry point, not a parallel status diary. Use the current documents below; previous dated handoffs are retained in Git history and the changelogs.

| Need | Authoritative document |
| --- | --- |
| Development rules and safe coordination | [AGENTS.md](AGENTS.md) |
| Project overview and current component versions | [README.md](README.md) |
| Core controls, outstanding work and deferred decisions | [ROADMAP.md](ROADMAP.md) |
| Add-in, Ribbon and updater outstanding work | [tbIDE/ROADMAP.md](tbIDE/ROADMAP.md) |
| Current Phase 1 acceptance checkpoint, exact build/test sequence | [tbIDE/PHASE1_HANDOFF.md](tbIDE/PHASE1_HANDOFF.md) |
| Approved updater/installation-manager product behavior | [tbIDE/INSTALLATION_MANAGER_SPEC.md](tbIDE/INSTALLATION_MANAGER_SPEC.md) |
| Native update/installation contracts | [tbIDE/INSTALLATION_CONTRACTS.md](tbIDE/INSTALLATION_CONTRACTS.md) |
| Core and IDE implementation history | [CHANGELOG.md](CHANGELOG.md), [tbIDE/CHANGELOG.md](tbIDE/CHANGELOG.md) |
| Control fidelity, architecture and evidence | [Control fidelity](docs/CONTROL_FIDELITY_POLICY.md), [rendering](docs/RENDERING.md), [property pages](docs/PROPERTY_PAGE_GUIDE.md), [IDE architecture](tbIDE/ARCHITECTURE.md), [diagnostics](docs/DIAGNOSTICS.md) |

For a new development pass, synchronize the latest `tbui3-dev` and review the applicable roadmap, changelog and technical contract. Keep current state in place; do not add a new dated handoff section here. Do not claim test or compile results without evidence. Preserve canonical project identities, packed project/mirror agreement, and approval boundaries.

## Documentation organization

- Root README, AGENTS, CHANGELOG and ROADMAP are the project-wide entry points. tbIDE has its own component README, CHANGELOG and ROADMAP.
- `docs/` contains enduring package contracts (fidelity, rendering, property pages, versioning, diagnostics); `docs/controls/` contains per-control contracts; `docs/research/`, `docs/reviews/` and `docs/validation/` hold investigation/review/validation evidence. Dated milestone plans are historical context, not competing current instructions.
- `tbIDE/` holds the IDE architecture, Ribbon layout, installation product specification, native contracts and current acceptance handoff. The updater README is its operational entry point; the approved wizard directory contains its view-specific integration API and browser preview. Do not recreate retired planning/coordination files.
- `reference-packages/src/`, `tbUI3/src/` and embedded test package copies are source/package mirrors; preserve their vendor/license and generated documentation. Do not move or edit them merely to reduce Markdown counts.
- Preserve historical evidence and third-party notices. No private diagnostic sources, organization-specific paths or private repository links in public prose.
