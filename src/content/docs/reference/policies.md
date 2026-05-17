---
title: Runtime Policies
description: How Ratatouille runtime policies work — structure, generation, signing, and update workflow.
---

<a href="/" class="back-to-site">← ratatouille.dev</a>

A **runtime policy** in Ratatouille is a JSON document that defines the set of approved
file measurements for an attested machine. The Keylime verifier checks every IMA log entry
against this policy; any measurement not in the policy is a violation.

---

## Policy structure

Ratatouille runtime policies follow the Keylime policy format:

```json
{
  "meta": {
    "version": 1,
    "generator": 1,
    "timestamp": "2025-11-10T14:32:00Z"
  },
  "release": 0,
  "digests": {
    "/usr/bin/python3.11": [
      "a3f9d8e1c2b4f7a819d2c35e7f104b8a2d91c7f3e8b5d2a1c4f9e7b3d6a8c2f1"
    ],
    "/usr/lib/x86_64-linux-gnu/libc.so.6": [
      "b5e2a9f3c1d7e4b8a2c5f9e3d6b1a4c8f2e7d3b9a5c1e8f4d2b6a3c9f7e1b4d5"
    ]
  },
  "excludes": [
    "^/tmp/_MEI[A-Za-z0-9]+/.*",
    "^/tmp/tmp\\.[A-Za-z0-9]+",
    "^/var/cache/apt/.*",
    "^/var/lib/apt/.*",
    "^/var/lib/google-cloud-ops-agent/.*"
  ],
  "keyrings": {},
  "ima": {
    "ignored_keyrings": [],
    "dm_policy": null
  }
}
```

The `digests` map is a path → list of SHA256 hashes. Multiple hashes per path allow
for version transitions (old and new binary both approved during a rollout window).

The `excludes` array is a list of regex patterns. Any IMA log entry whose path matches an exclude pattern is **skipped during verification** — the file is not required to be in `digests`. This is a pragmatic escape hatch for files that legitimately appear under non-deterministic paths (random per-invocation extraction directories, log buffers with timestamped names, etc.). Excludes trade strictness for operability and should be used sparingly.

---

## Default excludes

Ratatouille ships with a small default set of excludes for paths that are noisy on virtually any modern Linux system. They're applied to every baseline-generated policy:

| Pattern | What it skips | Why |
|---|---|---|
| `^/tmp/_MEI[A-Za-z0-9]+/.*` | PyInstaller extraction directories | The `rat` CLI is itself a PyInstaller binary that extracts its embedded Python + libs to a random `/tmp/_MEI<rand>/` on every invocation. Without this exclude every `rat` run would fail attestation. |
| `^/tmp/tmp\.[A-Za-z0-9]+` | `mktemp` outputs | apt and many shell scripts use mktemp for transient files. The path is random per invocation. |
| `^/var/cache/apt/.*` | apt download cache | apt creates timestamped `pkgcache.bin.XXX` files. Unattended-upgrades touches these on a schedule. |
| `^/var/lib/apt/.*` | apt state directory | Similar `.apt-acquire-privs-test.XXX` transient files. |
| `^/var/lib/google-cloud-ops-agent/.*` | GCP ops agent buffers | Constant log buffer rotation with random names. Common on GCP-hosted demo deployments. |

**Security implication**: anything an attacker writes into one of these paths would not be flagged by attestation. The `apt` binary itself (at `/usr/bin/apt`) is still verified — what's excluded is the random-named state files it creates, not the tools that create them.

**Tuning excludes**: you can edit `excludes` directly in `runtime_policy.json`, sign, and push. Add patterns sparingly: every exclude is a hole in the attestation surface.

---

---

## How the baseline policy is generated

When a machine enrolls via `rat init <fleet> --bootstrap` (or `rat enroll` against a baseline-typed token), Ratatouille:

1. Receives the full IMA ascii measurement log from the agent
2. Calls Keylime's `create_policy.py` with the log as input
3. Stores the resulting policy as `Baseline::<group_name>` in the database

**The policy is built from TPM-measured values** (what IMA recorded at execution time), not by re-hashing files on disk. On-disk hashing is vulnerable to TOCTOU races; IMA records what actually executed, including transient files that may no longer exist on disk.

---

## Policy enrollment methods

**Baseline enrollment** (the default) is designed for the most common case: you have a machine in a known-good state, you enroll it, and the IMA log at that moment becomes the approved baseline. The trust assumption is that the machine was clean at enrollment time.

**Staged golden device** enrollment is used in controlled lab environments where a known-good machine can be brought to a clean state before policy capture. This provides the highest assurance, since the policy was captured from a machine whose state was explicitly verified.

**CI/CD predictive policy** is appropriate for large fleets where staging hardware isn't available. The policy is generated from the build pipeline's output rather than a live machine's IMA log, so the trust assumption shifts to the pipeline accurately representing what will execute in production.

**Field enrollment** is used when no staging environment is available at all. Trust for the initial state rests on the vendor's Secure Boot and firmware chain for first-boot integrity.

---

## Choosing the right policy strictness

Policy configuration should match the operational context of the machine being attested.

**Tightly bounded devices** — IoT devices, field appliances, embedded controllers — are well-suited
for strict IMA policies. The set of binaries that should ever execute is small and predictable.
A tight policy here maximizes the value of attestation: any unexpected execution is immediately
caught.

**Long-running servers** subject to routine updates and unpredictable workloads are harder targets
for strict IMA policies, since predicting every binary that will execute is impractical.
For these machines, consider prioritizing Measured Boot (PCR 7 + PCR 10 at boot time) and
keeping runtime IMA policy checks at a minimum. You can still prove to a relying party that
Secure Boot occurred, that the modules loaded during boot are what you expect, and that those
modules haven't changed since. Layer in broader IMA coverage as the workload stabilizes.

**The golden pipeline** — where possible — is to run `rat init` as the final step in a
CI/CD pipeline after known-good code is deployed to a device, and have the CI system sign
and push the new policy automatically. This ties policy changes directly to auditable code changes.

---

## GitOps policy update workflow

Runtime policies live in a Git repository. The update workflow is:

```
1. Edit runtime_policy.json
2. rat sign runtime/runtime_policy.json
3. git add runtime/ && git commit -m "policy: v5" && git push
```

On push, Ratatouille's GitHub webhook receives the event and fetches the policy and bundle from the specific commit SHA (not HEAD, which is an immutable reference). The Sigstore bundle is verified: signature valid, signer identity authorized, Rekor log entry confirmed. The policy is stored in the database with `commit_sha`, `signed_by`, `rekor_log_id`, and `status: active`, then `keylime_tenant` runs for every agent in the policy group to apply the new policy.

**Rollback** is a git revert: push the previous version signed by an authorized identity.

---

## Policy signing with Sigstore

Ratatouille uses **keyless** Sigstore signing, with no long-lived signing keys to manage.

```bash
rat sign runtime/runtime_policy.json
```

`rat sign` is a wrapper around the Sigstore Python library (installed with Ratatouille —
no separate tooling required). The signer authenticates via OIDC (Google, GitHub, Microsoft).
Sigstore issues a short-lived certificate bound to the authenticated identity (email / workload
identity). The certificate and signature are logged to the **Rekor** public transparency ledger,
which is immutable and auditable.

The bundle (`artifact.sigstore.json`) contains everything needed to verify the signature offline: the signature itself, the signing certificate, and the Rekor transparency log entry with inclusion proof.

---

## Policy violations

A violation occurs when the verifier finds an IMA log entry whose hash is not in the policy.

A violation is triggered when a new binary executes on the machine (e.g., `/tmp/evil` or `cp /bin/ls /tmp/evil_ls && /tmp/evil_ls`), when a measured file's hash has changed since the policy was generated, or when a new kernel module loads that isn't in the policy. Shell script execution does not trigger a violation (the interpreter, `bash`, is measured, not the script content), and neither do file reads without execution.

When a violation occurs, the Keylime verifier stops polling the agent, Ratatouille sets the agent status to `failed`, and any attestation token that was issued should be revoked by the relying party.

---

## IMA policy note

IMA is a kernel subsystem configured by kernel boot parameters and `/etc/ima/ima-policy`.
For the strongest runtime coverage, the kernel should boot with `ima_policy=tcb`, which
measures ELF binaries, kernel modules, and firmware. A minimal or missing IMA policy
results in a sparse measurement log and reduced attestation coverage.

Ratatouille's install script provisions the Keylime agent but does not modify the IMA kernel policy —
this is intentional, as IMA policy changes affect boot parameters and should be made deliberately
by the system owner.
