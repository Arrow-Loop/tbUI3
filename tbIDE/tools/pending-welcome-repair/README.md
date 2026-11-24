# Guarded Welcome and update UI repair handoff

This is a one-time source candidate for tbUI3IDE 0.4.0.3 based on the reported 0.4.0.2 failure at development commit ef6e59d. The existing packed projects and active source mirrors are deliberately unchanged until the complete candidate can be assembled and validated.

After synchronizing a clean tbui3-dev checkout, close twinBASIC and run from the repository root:

```powershell
node tbIDE/tools/pending-welcome-repair/apply.mjs --commit-push
```

The command verifies the exact baseline and all original source blob hashes, checks existing mirrors, applies the bounded source repair, renews the Welcome view hashes, uses the existing generators and add-in-only synchronization, verifies unchanged helper and release packaging, runs the full Node and isolated Wizard tests, and commits/pushes only after the checks pass. It requires the existing jsdom regression-test runtime. Without --commit-push it leaves the validated changes for GitHub Desktop. If an assembly or test fails, no commit or push occurs; inspect the working-tree changes and output.

This handoff is not a compiled release. Native acceptance must still cover BETA 1043 and 1045, real theme inventory and theme selection, both toolbar modes plus Classic, startup gating, dialog/notification behavior, and the add-in self-update. It does not modify or republish the updater engine or release packaging.
